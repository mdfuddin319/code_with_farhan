from flask import Flask, request, jsonify, render_template
from pymongo import MongoClient
from datetime import datetime
import pytz  # ✅ Needed for timezone handling

app = Flask(__name__)

# ✅ MongoDB Atlas connection (replace with your actual credentials)
client = MongoClient("mongodb+srv://Anish1:120308@webhook.ztwnc0n.mongodb.net/?retryWrites=true&w=majority&appName=webhook")
db = client['webhook_db']
collection = db['events']

@app.route('/webhook', methods=['POST'])
def webhook():
    data = request.json
    event_type = request.headers.get('X-GitHub-Event')
    print("Received event:", event_type)

    entry = {
        "type": event_type,
        "timestamp": datetime.now(pytz.utc).strftime('%d %B %Y - %I:%M %p UTC'),
    }

    if event_type == "push":
        entry.update({
            "author": data['pusher']['name'],
            "to_branch": data['ref'].split('/')[-1],
        })

    elif event_type == "pull_request":
        pr = data['pull_request']
        entry.update({
            "author": pr['user']['login'],
            "from_branch": pr['head']['ref'],
            "to_branch": pr['base']['ref'],
            "merged": pr.get('merged', False)  # ✅ Always present
        })

    else:
        return jsonify({"msg": "Unsupported event"}), 400

    collection.insert_one(entry)
    return jsonify({"msg": "Event stored"}), 200

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/events')
def get_events():
    events = list(collection.find({}, {'_id': 0}))
    return jsonify(events)

if __name__ == '__main__':
    app.run(debug=True)
