import threading
import time
import signal
import os

class CountdownTimer:
    def __init__(self, initial_time):
        self.countdown_timer = initial_time
        self.reset_event = threading.Event()
        self.countdown_thread = None
        self.time = initial_time
        self.active = False

   
    def countdown_timer_function(self):
        while self.countdown_timer > 0:
            print("Countdown (Thread):", self.countdown_timer)
            time.sleep(1)
            self.countdown_timer -= 1
            if self.reset_event.is_set():
                print("Countdown reset (Thread).")
                self.reset_event.clear()
        self.countdown_timer = self.time
        self.active = False

   
    def signal_handler(self):
        print("Received signal to reset countdown.")
        self.reset_event.set()
        self.countdown_timer = self.time

 
    def start_countdown(self):
        self.countdown_thread = threading.Thread(target=self.countdown_timer_function)
        self.countdown_thread.start()
        self.active = True

    def wait_for_completion(self):
        if self.countdown_thread:
            self.countdown_thread.join()

 
    def is_countdown_running(self) -> bool:
    
        return self.active
# if __name__ == "__main__":
#     timer = CountdownTimer()


#     print("Main thread ID:", os.getpid())

#     timer.start_countdown()
#     timer.wait_for_completion()

#     print("Countdown finished.")
