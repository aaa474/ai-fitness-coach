from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from pymongo import MongoClient
from datetime import datetime
from dotenv import load_dotenv
import os
import boto3
import json

load_dotenv()

try:
    aws_region = os.getenv("AWS_REGION")
    if not aws_region:
        raise ValueError("AWS_REGION environment variable is not set")
    
    print(f"Initializing Bedrock client in region: {aws_region}")
    bedrock = boto3.client(
        "bedrock-runtime",
        region_name=aws_region,
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
    )
    print("Bedrock client initialized successfully")
except Exception as e:
    print(f"Error initializing Bedrock client: {str(e)}")
    raise e

def generate_with_bedrock(prompt):
    model_id = os.getenv("BEDROCK_MODEL_ID")
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 1024,
        "temperature": 0.7,
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }

    response = bedrock.invoke_model(
        modelId=model_id,
        contentType="application/json",
        accept="application/json",
        body=json.dumps(body)
    )

    result = json.loads(response['body'].read())
    return result["content"][0]["text"]

mongo_uri = os.getenv("MONGO_URI")
client = MongoClient(mongo_uri)
db = client.fitness_ai
plans_collection = db.plans
daily_plans_collection = db.daily_plans
xp_collection = db.xp

app = Flask(__name__)
CORS(app)

@app.route("/api/generate-plan", methods=["POST"])
def generate_plan():
    try:
        data = request.get_json()

        required_fields = ['goal', 'age', 'height', 'weight', 'activityLevel', 'dietPreference', 'userEmail']
        missing = [field for field in required_fields if not data.get(field)]
        if missing:
            return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

        try:
            age = int(data.get('age'))
            height = float(data.get('height'))
            weight = float(data.get('weight'))

            if age <= 0 or age > 120 or height <= 50 or height > 300 or weight <= 20 or weight > 300:
                return jsonify({"error": "Please enter realistic values."}), 400
        except ValueError:
            return jsonify({"error": "Invalid numeric input."}), 400

        prompt = f"""Create a personalized fitness and diet plan for the following user:
        Goal: {data.get('goal')}
        Age: {data.get('age')}
        Height: {data.get('height')} cm
        Weight: {data.get('weight')} kg
        Activity Level: {data.get('activityLevel')}
        Diet Preference: {data.get('dietPreference')}

        At the end of the response, include a section titled 'Helpful Resources:'
        List 2-3 helpful, real, verified links in markdown format, like:
        [Title](https://real-url.com)

        Do not include fake links, invented URLs, or placeholders.
        Only use working URLs from reputable sources like Healthline, Mayo Clinic, WebMD, YouTube, or official health sites.
        """

        plan_text = generate_with_bedrock(prompt)

        plans_collection.insert_one({
            "user": data.get("userEmail"),
            "inputs": {
                "goal": data.get('goal'),
                "age": data.get('age'),
                "height": data.get('height'),
                "weight": data.get('weight'),
                "activityLevel": data.get('activityLevel'),
                "dietPreference": data.get('dietPreference'),
            },
            "plan": plan_text,
            "timestamp": datetime.utcnow()
        })

        return jsonify({"plan": plan_text})

    except Exception as e:
        print("Server Error:", e)
        return jsonify({"error": "Server error occurred. Please try again."}), 500
    
@app.route("/api/track-progress", methods=["POST"])
def track_progress():
    try:
        data = request.get_json()
        user = data.get("userEmail")
        weight = data.get("weight")
        note = data.get("note")

        if not user or not weight:
            return jsonify({"error": "Missing user or weight"}), 400

        timestamp = datetime.utcnow()

        db.progress.insert_one({
            "user": user,
            "weight": float(weight),
            "note": note,
            "timestamp": timestamp
        })
        
        xp_doc = xp_collection.find_one({"user": user})
        if not xp_doc:
            xp_collection.insert_one({
                "user": user,
                "xp": 10,
                "badges": ["First Log"],
                "last_log": timestamp
            })
        else:
            days_diff = (timestamp.date() - xp_doc["last_log"].date()).days
            new_xp = xp_doc["xp"] + 10
            new_badges = xp_doc["badges"]

            if days_diff == 1:
                new_badges = list(set(new_badges + ["2-Day Streak"]))
            if days_diff > 1:
                new_badges = list(set(new_badges))  

            xp_collection.update_one(
                {"user": user},
                {"$set": {
                    "xp": new_xp,
                    "badges": new_badges,
                    "last_log": timestamp
                }}
            )

        return jsonify({"message": "Progress saved!"})

    except Exception as e:
        print("Progress error:", e)
        return jsonify({"error": "Failed to save progress"}), 500
    
@app.route("/api/get-progress", methods=["POST"])
def get_progress():
    try:
        data = request.get_json()
        user = data.get("userEmail")

        if not user:
            return jsonify({"error": "Missing userEmail"}), 400

        entries = list(db.progress.find({"user": user}))
        for e in entries:
            e["_id"] = str(e["_id"])
            e["timestamp"] = e["timestamp"].isoformat()

        return jsonify({"entries": entries})
    except Exception as e:
        print("Get progress error:", e)
        return jsonify({"error": "Failed to fetch progress"}), 500
    
@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        message = data.get("message")
        user_email = data.get("userEmail", "anonymous")
        language = data.get("language", "English")

        if not message:
            return jsonify({"error": "Missing message"}), 400

        
        last_plan = plans_collection.find_one({"user": user_email}, sort=[("timestamp", -1)])
        plan_text = last_plan["plan"] if last_plan else "No plan available."

      
        progress_entries = list(db.progress.find({"user": user_email}).sort("timestamp", -1).limit(5))
        progress_log = "\n".join([f"{e['timestamp'].strftime('%Y-%m-%d')}: {e['weight']}kg" for e in progress_entries])

        prompt = f"""You are a helpful AI fitness coach. The user asked:
        "{message}"

        User Info:
        - Latest Plan: {plan_text}
        - Recent Weight Log:
        {progress_log}

        Respond helpfully in {language}. Keep it friendly and brief.

        At the end of the response, include a section titled 'Helpful Resources:'
        List 2–3 helpful, real, verified links in markdown format, like:
        [Title](https://real-url.com)

        Do not include fake links, invented URLs, or placeholders.
        Only use working URLs from reputable sources like Healthline, Mayo Clinic, WebMD, YouTube, or official health sites.
        """

        reply = generate_with_bedrock(prompt)

        return jsonify({"reply": reply})
    except Exception as e:
        print("Chat error:", e)
        return jsonify({"error": "Chat failed"}), 500
    
@app.route("/api/get-plans", methods=["POST"])
def get_plans():
    try:
        data = request.get_json()
        user_email = data.get("userEmail")
        if not user_email:
            return jsonify({"error": "Missing email"}), 400

        plans = list(plans_collection.find({"user": user_email}).sort("timestamp", -1))
        for plan in plans:
            plan["_id"] = str(plan["_id"])
            plan["timestamp"] = plan["timestamp"].isoformat()
        return jsonify({"plans": plans})
    except Exception as e:
        print("Get plans error:", e)
        return jsonify({"error": "Failed to fetch plans"}), 500

@app.route("/api/daily-checkin", methods=["POST"])
def daily_checkin():
    try:
        data = request.get_json()
        user_email = data.get("userEmail")
        if not user_email:
            return jsonify({"error": "Missing email"}), 400

        last_progress = db.progress.find_one({"user": user_email}, sort=[("timestamp", -1)])
        today = datetime.utcnow().date()
        logged_today = last_progress and last_progress["timestamp"].date() == today

        return jsonify({
            "loggedToday": logged_today,
            "message": (
                "You've logged your progress today. Great job!" if logged_today
                else "Don't forget to log your weight and review your plan!"
            )
        })
    except Exception as e:
        print("Check-in error:", e)
        return jsonify({"error": "Failed to check daily status"}), 500

@app.route("/api/get-xp", methods=["POST"])
def get_xp():
    try:
        data = request.get_json()
        user_email = data.get("userEmail")
        if not user_email:
            return jsonify({"error": "Missing email"}), 400

        doc = xp_collection.find_one({"user": user_email})
        if not doc:
            return jsonify({"xp": 0, "badges": []})
        
        return jsonify({
            "xp": doc.get("xp", 0),
            "badges": doc.get("badges", [])
        })
    except Exception as e:
        print("XP fetch error:", e)
        return jsonify({"error": "Failed to fetch XP"}), 500

@app.route("/api/get-daily-plan", methods=["POST"])
def get_daily_plan():
    try:
        data = request.get_json()
        user_email = data.get("userEmail")
        if not user_email:
            return jsonify({"error": "Missing email"}), 400

        today_str = datetime.utcnow().strftime("%Y-%m-%d")
        existing = daily_plans_collection.find_one({"user": user_email, "date": today_str})
        if existing:
            return jsonify({"plan": existing["plan"]})

        
        last_plan = plans_collection.find_one({"user": user_email}, sort=[("timestamp", -1)])
        plan_text = last_plan["plan"] if last_plan else "No existing plan."

        progress_entries = list(db.progress.find({"user": user_email}).sort("timestamp", -1).limit(5))
        progress_log = "\n".join([f"{e['timestamp'].strftime('%Y-%m-%d')}: {e['weight']}kg" for e in progress_entries])

        prompt = f"""You are a smart AI fitness assistant.

        Based on this user's latest plan and recent weight logs, generate a personalized DAILY fitness and diet routine they should follow today.

        Plan:
        {plan_text}

        Recent Weight Log:
        {progress_log}

        Include detailed workout and meals for the day. End with a section titled 'Helpful Resources:' with 2–3 real markdown links, like:
        [Title](https://url.com)

        Only include real links from reputable sources (e.g. Mayo Clinic, Healthline, YouTube, WebMD). Do not make up URLs.
        """

        plan_response = generate_with_bedrock(prompt)

        daily_plans_collection.insert_one({
            "user": user_email,
            "date": today_str,
            "plan": plan_response,
            "timestamp": datetime.utcnow()
        })

        xp_doc = xp_collection.find_one({"user": user_email})
        if not xp_doc:
            xp_collection.insert_one({
                "user": user_email,
                "xp": 5,
                "badges": ["First Daily Plan"],
                "last_daily": datetime.utcnow()
            })
        else:
            days_diff = (datetime.utcnow().date() - xp_doc.get("last_daily", datetime.utcnow()).date()).days
            new_xp = xp_doc.get("xp", 0) + 5
            new_badges = xp_doc.get("badges", [])

            if "First Daily Plan" not in new_badges:
                new_badges.append("First Daily Plan")

            history = list(daily_plans_collection.find({"user": user_email}).sort("timestamp", -1).limit(7))
            streak = 1
            for i in range(1, len(history)):
                curr_day = history[i-1]["timestamp"].date()
                prev_day = history[i]["timestamp"].date()
                if (curr_day - prev_day).days == 1:
                    streak += 1
                else:
                    break

            if streak >= 3 and "3-Day Streak" not in new_badges:
                new_badges.append("3-Day Streak")
            if streak >= 7 and "7-Day Consistency" not in new_badges:
                new_badges.append("7-Day Consistency")

            xp_collection.update_one(
                {"user": user_email},
                {"$set": {
                    "xp": new_xp,
                    "badges": new_badges,
                    "last_daily": datetime.utcnow()
                }}
            )

        return jsonify({"plan": plan_response})

    except Exception as e:
        print("Daily plan error:", e)
        return jsonify({"error": "Failed to generate daily plan"}), 500
    
@app.route("/api/test-bedrock", methods=["GET"])
def test_bedrock():
    try:
        # Test AWS credentials
        print("Testing AWS credentials and Bedrock connectivity...")
        region = os.getenv("AWS_REGION")
        model_id = os.getenv("BEDROCK_MODEL_ID")
        
        if not region or not model_id:
            return jsonify({
                "status": "error",
                "message": "Missing AWS configuration",
                "details": {
                    "region": "not set" if not region else "set",
                    "model_id": "not set" if not model_id else "set"
                }
            }), 400

        # Test Bedrock connectivity
        response = bedrock.list_foundation_models()
        return jsonify({
            "status": "success",
            "message": "AWS Bedrock connection successful",
            "region": region,
            "model_id": model_id
        })
    except Exception as e:
        print(f"Bedrock test error: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e),
            "type": type(e).__name__
        }), 500

@app.route("/api/get-daily-history", methods=["POST"])
def get_daily_history():
    try:
        data = request.get_json()
        user_email = data.get("userEmail")
        if not user_email:
            return jsonify({"error": "Missing email"}), 400

        plans = list(daily_plans_collection.find({"user": user_email}).sort("timestamp", -1).limit(7))
        history = [{"plan": p["plan"], "timestamp": p["timestamp"]} for p in plans]

        return jsonify({"history": history})

    except Exception as e:
        print("History error:", e)
        return jsonify({"error": "Failed to retrieve daily plan history"}), 500
    
def generate_with_bedrock(prompt):
    try:
        model_id = os.getenv("BEDROCK_MODEL_ID")
        if not model_id:
            raise ValueError("BEDROCK_MODEL_ID environment variable is not set")
        print(f"Using Bedrock model: {model_id}")
        
        body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1024,
            "temperature": 0.7,
            "messages": [{"role": "user", "content": prompt}]
        }

        print("Attempting to invoke Bedrock model...")
        try:
            response = bedrock.invoke_model(
                modelId=model_id,
                contentType="application/json",
                accept="application/json",
                body=json.dumps(body)
            )
            print("Successfully received response from Bedrock")
            
            result = json.loads(response['body'].read())
            return result["content"][0]["text"]
            
        except boto3.exceptions.ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            print(f"AWS Bedrock Error - Code: {error_code}, Message: {error_message}")
            if 'AccessDeniedException' in str(e):
                print("Access denied - check IAM permissions and credentials")
            raise
            
    except Exception as e:
        print(f"Unexpected error in generate_with_bedrock: {str(e)}")
        print(f"AWS Region: {os.getenv('AWS_REGION')}")
        print(f"Model ID: {os.getenv('BEDROCK_MODEL_ID')}")
        raise e

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)