from socket import socket, AF_INET, SOCK_STREAM
from threading import Thread
import json
import asyncio

ip = '127.0.0.1'
port = 5001

#class ServerThread(Thread):
#    def __init__(self, q_main, q_worker):
#        self.queue_main = q_main
#        self.queue_worker = q_worker
#        super().__init__()
#    def run(self):
#        while True:
#            sleep(1)
#            self.queue_main.put('run help')
#            item = self.queue_worker.get()      # waits for item from main thread
#            print('Received ', item)
#def sock_connect():
#    try:
#        print('Thread start')
#        sock = socket(AF_INET, SOCK_STREAM)
#        sock.connect(('127.0.0.1', 5001))
#    except KeyboardInterrupt:
#        sock.close()
#
#thread = Thread(target = sock_connect)
#thread.start()
def set_addr(ip_, port_):
    global ip, port
    ip=ip_
    port =port_

def send_to_bot(data: dict):
    json_data = json.dumps(data)
    sock = socket(AF_INET, SOCK_STREAM)
    resp = None
    try:
        sock.connect(('127.0.0.1', 5001))
        sock.send(json_data.encode())
        resp = json.loads(sock.recv(4096))

    except Exception as e:
        print(e)
    finally:
        try:
            sock.close()
        except:
            pass
        finally:
            return resp