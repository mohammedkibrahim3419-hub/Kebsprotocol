from http.server import HTTPServer, SimpleHTTPRequestHandler

class QuietHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/favicon.ico':
            self.send_response(204)
            self.end_headers()
            return
        super().do_GET()
    def log_message(self, format, *args):
        pass

class QuietServer(HTTPServer):
    def handle_error(self, request, client_address):
        pass

httpd = QuietServer(('', 8080), QuietHandler)
httpd.serve_forever()
