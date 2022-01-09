



def is_bot_response_success(resp):
    if resp['type'] == 'result':
        return True
    return False

def get_working_dir():
    import sys
    import os.path as path
    if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
        app_path = sys._MEIPASS
    else:
        app_path = path.dirname(path.abspath(__file__))
    return app_path