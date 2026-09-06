# Cloud Run용 HWP→텍스트 변환 서비스
# ⚠️ 로컬에 Docker가 없어 빌드·실행 검증을 못 했다. 배포 전 반드시 로컬 빌드 테스트할 것.

FROM node:20-slim

# LibreOffice headless (HWP 가져오기 필터 포함 버전 사용)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-writer \
    fonts-nanum \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.js ./

ENV PORT=8080
EXPOSE 8080
CMD ["node", "server.js"]
