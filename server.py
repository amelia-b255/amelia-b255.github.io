#!/usr/bin/env python3
"""Local dev server with no-cache + HTTP Range support (so video seeking works)."""
import http.server
import socketserver
import sys
import os
import re

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080


class _RangedFile:
    """File wrapper that returns at most `remaining` bytes total via read()."""
    def __init__(self, f, length):
        self.f = f
        self.remaining = length

    def read(self, size=-1):
        if self.remaining <= 0:
            return b''
        if size is None or size < 0 or size > self.remaining:
            size = self.remaining
        data = self.f.read(size)
        self.remaining -= len(data)
        return data

    def close(self):
        try:
            self.f.close()
        except Exception:
            pass


class NoCacheRangeHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Aggressive no-cache (Safari-friendly): no-store + private + must-revalidate
        self.send_header('Cache-Control',
                         'no-store, no-cache, private, must-revalidate, proxy-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Vary', '*')  # tell caches every request is unique
        # Advertise byte-range support so browsers know they can seek
        self.send_header('Accept-Ranges', 'bytes')
        super().end_headers()

    def log_message(self, format, *args):
        pass  # suppress request logs

    def send_head(self):
        path = self.translate_path(self.path)
        # Directories: fall back to default behaviour (index.html / listing)
        if os.path.isdir(path):
            return super().send_head()

        try:
            f = open(path, 'rb')
        except OSError:
            self.send_error(404, 'File not found')
            return None

        try:
            fs = os.fstat(f.fileno())
            file_size = fs.st_size
            range_header = self.headers.get('Range')
            ctype = self.guess_type(path)

            if range_header:
                m = re.match(r'bytes=(\d*)-(\d*)', range_header)
                if m:
                    start_s, end_s = m.group(1), m.group(2)
                    if start_s == '' and end_s == '':
                        # malformed — fall through to full response
                        pass
                    elif start_s == '':
                        # suffix range: last N bytes
                        suffix = int(end_s)
                        suffix = min(suffix, file_size)
                        start = file_size - suffix
                        end = file_size - 1
                    else:
                        start = int(start_s)
                        end = int(end_s) if end_s else file_size - 1

                    if start >= file_size:
                        self.send_response(416)
                        self.send_header('Content-Range', f'bytes */{file_size}')
                        self.end_headers()
                        f.close()
                        return None

                    end = min(end, file_size - 1)
                    length = end - start + 1

                    self.send_response(206)
                    self.send_header('Content-Type', ctype)
                    self.send_header('Content-Range', f'bytes {start}-{end}/{file_size}')
                    self.send_header('Content-Length', str(length))
                    self.send_header('Last-Modified', self.date_time_string(fs.st_mtime))
                    self.end_headers()
                    f.seek(start)
                    return _RangedFile(f, length)

            # No Range header → full file
            self.send_response(200)
            self.send_header('Content-Type', ctype)
            self.send_header('Content-Length', str(file_size))
            self.send_header('Last-Modified', self.date_time_string(fs.st_mtime))
            self.end_headers()
            return f
        except Exception:
            f.close()
            raise


socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(('', PORT), NoCacheRangeHandler) as httpd:
    print(f'Serving on port {PORT} (no-cache + Range requests enabled)')
    httpd.serve_forever()
