import os
import sys
import time
import signal
import shutil
import socket
import subprocess
import webbrowser
from pathlib import Path

# Paths
ROOT_DIR = Path(__file__).resolve().parent
BACKEND_SCRIPT = ROOT_DIR / "backend" / "server.py"

def is_port_in_use(port: int) -> bool:
    """Check if a local TCP port is already open/listening."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(("127.0.0.1", port)) == 0

def kill_process_on_port(port: int):
    """Attempt to terminate any process holding the specified port on Windows."""
    try:
        cmd = f'powershell -Command "Get-NetTCPConnection -LocalPort {port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique"'
        out = subprocess.check_output(cmd, shell=True, text=True).strip()
        if out:
            pids = [int(p) for p in out.splitlines() if p.strip().isdigit()]
            for pid in pids:
                if pid > 0:
                    subprocess.run(f"taskkill /F /PID {pid}", shell=True, capture_output=True)
            time.sleep(1)
    except Exception:
        pass

def main():
    print("=" * 64)
    print("          ⚡ GridPulse Intelligent SCADA Platform ⚡")
    print("=" * 64)

    # 1. Clean up any lingering process on port 5000 if occupied
    if is_port_in_use(5000):
        print("[Launcher] Port 5000 is in use. Freeing port 5000...")
        kill_process_on_port(5000)

    # 2. Check for npm
    npm_cmd = shutil.which("npm.cmd") or shutil.which("npm")
    if not npm_cmd:
        print("[Error] Node.js / npm not found in system PATH.")
        print("Please ensure Node.js is installed to run the frontend.")
        sys.exit(1)

    python_exe = sys.executable

    print("\n[1/3] Starting Python FastAPI Backend Server (Port 5000)...")
    backend_proc = subprocess.Popen(
        [python_exe, str(BACKEND_SCRIPT)],
        cwd=str(ROOT_DIR)
    )

    # Wait briefly and verify backend is spinning up
    time.sleep(2)
    if backend_proc.poll() is not None:
        print("[Error] Backend failed to start.")
        sys.exit(1)
    print("  --> Backend initialized! (FastAPI + WebSockets on :5000)")

    print("\n[2/3] Starting React Vite Frontend Server (Port 5173)...")
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=str(ROOT_DIR)
    )

    time.sleep(2.5)
    if frontend_proc.poll() is not None:
        print("[Error] Frontend failed to start.")
        if backend_proc.poll() is None:
            backend_proc.terminate()
        sys.exit(1)
    print("  --> Frontend initialized! (Vite on :5173)")

    print("\n[3/3] Opening dashboard in browser...")
    dashboard_url = "http://localhost:5173"
    webbrowser.open(dashboard_url)

    print("\n" + "=" * 64)
    print(f"  ● SCADA Dashboard is LIVE at: {dashboard_url}")
    print(f"  ● Backend API & WebSockets:  http://localhost:5000")
    print("  ● Press CTRL+C at any time to gracefully stop all servers.")
    print("=" * 64 + "\n")

    def cleanup():
        print("\n[Launcher] Shutting down GridPulse servers...")
        try:
            if backend_proc.poll() is None:
                # Windows taskkill /T kills entire process tree
                subprocess.run(f"taskkill /F /T /PID {backend_proc.pid}", shell=True, capture_output=True)
            if frontend_proc.poll() is None:
                subprocess.run(f"taskkill /F /T /PID {frontend_proc.pid}", shell=True, capture_output=True)
        except Exception:
            pass
        print("[Launcher] All services stopped cleanly. Goodbye!\n")

    # Keep script running and relay status
    try:
        while True:
            # Check if any process terminated unexpectedly
            if backend_proc.poll() is not None:
                print(f"[Warning] Backend process exited with code {backend_proc.returncode}")
                break
            if frontend_proc.poll() is not None:
                print(f"[Warning] Frontend process exited with code {frontend_proc.returncode}")
                break
            time.sleep(1)
    except KeyboardInterrupt:
        pass
    finally:
        cleanup()

if __name__ == "__main__":
    main()
