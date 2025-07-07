import subprocess
import sys

def install_requirements():
    """requirements.txt 파일에 명시된 패키지를 설치합니다."""
    print("--- requirements.txt 설치 시작 ---")
    try:
        # pip를 subprocess로 실행하여 requirements.txt 설치
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("--- requirements.txt 설치 완료 ---\n")
    except subprocess.CalledProcessError as e:
        print(f"오류: requirements.txt 설치에 실패했습니다. {e}")
        sys.exit(1)

def install_playwright_browsers():
    """Playwright의 브라우저를 설치합니다."""
    print("--- Playwright 브라우저 설치 시작 (시간이 걸릴 수 있습니다) ---")
    try:
        # playwright install 명령어를 subprocess로 실행
        subprocess.check_call([sys.executable, "-m", "playwright", "install"])
        print("--- Playwright 브라우저 설치 완료 ---\n")
    except subprocess.CalledProcessError as e:
        print(f"오류: Playwright 브라우저 설치에 실패했습니다. {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("프로젝트 환경 설정을 시작합니다.")
    install_requirements()
    install_playwright_browsers()
    print("모든 설정이 완료되었습니다! 이제 크롤러를 실행할 수 있습니다.")