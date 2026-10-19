import os
import subprocess
import sys
from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer


class RestartHandler(FileSystemEventHandler):

    def __init__(self, script_name):
        self.script_name = script_name
        self.process = None
        self.start_process()

    def start_process(self):
        if self.process:
            self.process.kill()
        print(f"\n🔄 Đang khởi động lại {self.script_name}...")
        self.process = subprocess.Popen([sys.executable, self.script_name])

    def on_modified(self, event):
        if event.src_path.endswith(".py"):
            print(f"\n📁 Phát hiện file {event.src_path} vừa được thay đổi!")
            self.start_process()


if __name__ == "__main__":
    script = "sever.py"  # Tên file server của bạn
    event_handler = RestartHandler(script)
    observer = Observer()
    observer.schedule(
        event_handler, path=".", recursive=False
    )  # Theo dõi thư mục hiện tại
    observer.start()
    print(
        f"👀 Đang theo dõi thay đổi file. Web sẽ tự động reload khi bạn lưu code!"
    )

    try:
        while True:
            import time

            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        if event_handler.process:
            event_handler.process.kill()
        observer.join()