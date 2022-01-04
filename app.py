from os import stat
from flask import Flask, render_template, request, Response
from local_bridge import send_to_bot, set_addr
from utils import is_bot_response_success
from configparser import ConfigParser
import waitress
import json

app = Flask(__name__)
app.config['TEMPLATES_AUTO_RELOAD'] = True

ROOT_ACCESS_SECRET = 'OkS1vGLyJBwokfat606CqNmqHBNZlfIy'

@app.after_request
def add_header(r):
    """
    Add headers to both force latest IE rendering engine or Chrome Frame,
    and also to cache the rendered page for 10 minutes.
    """
    r.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    r.headers["Pragma"] = "no-cache"
    r.headers["Expires"] = "0"
    r.headers['Cache-Control'] = 'public, max-age=0'
    return r


@app.route("/<web_id>")
def base(web_id):
    resp = send_to_bot({'cmd':'get_queue', 'args':{'web_id':f'{web_id}'}})
    if is_bot_response_success(resp):
        return render_template('controls.html')
    else:
        return Response(status=404)

@app.route("/<web_id>/cmd", methods=['POST'])
def cmd(web_id):
        json_content = request.json
        print(json_content)
        json_content['args']['web_id'] = web_id
        resp = send_to_bot(json_content)
        return Response(json.dumps(resp), status=200 if is_bot_response_success(resp) else 404)
        
#@socketio.on('json')
#def handle_json(json):
#    print('received json: ' + str(json))

if __name__ == '__main__':
    parser = ConfigParser()
    parser.read('config.ini')
    ip = parser['LOCAL_SERVER']['Ip']
    port = parser['LOCAL_SERVER']['Port']
    set_addr(ip, port)
    ip_web = parser['WEB']['Ip']
    port_web = parser['WEB']['Port']
    url = f'http://{ip_web}:{port_web}'
    url_cmd = {'cmd':'set_url', 'args':{'web_url':url}}
    if not send_to_bot(url_cmd):
        print('Unable to connect to bot. Make sure it is launched and local server addresses match.')
        exit()
    print(f'Connected to {ip}:{port}')
    #app.run(ip_web, port_web, True)
    waitress.serve(app, host=ip_web, port=port_web)