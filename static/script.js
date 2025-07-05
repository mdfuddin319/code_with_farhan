function fetchEvents() {
    fetch('/events')
        .then(res => res.json())
        .then(data => {
            const list = document.getElementById('events');
            list.innerHTML = '';
            data.reverse().forEach(event => {
                let line = "";
                if (event.type === "push") {
                    line = `${event.author} pushed to ${event.to_branch} on ${event.timestamp}`;
                } else if (event.type === "pull_request") {
                    if (event.merged) {
                        line = `${event.author} merged branch ${event.from_branch} to ${event.to_branch} on ${event.timestamp}`;
                    } else {
                        line = `${event.author} submitted a pull request from ${event.from_branch} to ${event.to_branch} on ${event.timestamp}`;
                    }
                }
                const li = document.createElement('li');
                li.textContent = line;
                list.appendChild(li);
            });
        });
}

setInterval(fetchEvents, 15000);
window.onload = fetchEvents;
