



def is_bot_response_success(resp):
    if resp['type'] == 'result':
        return True
    return False