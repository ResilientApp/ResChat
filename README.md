# Project Setup Guide


## Build and Installation
### Install Bazel 7

#### Prerequisites
- GCC and G++
```bash
sudo apt install gcc-11
sudo apt install g++-11
```
- OpenSSL
```bash
sudo apt install openssl libssl-dev
```
- Python 3.8

#### Installation
1. Install C++ dependencies:  
```bash
sudo apt install openssl libssl-dev
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```
3. Bazel Build
```bash
cd backend/bazel
bazel build //...
```

## Frontend Build
```bash
cd frontend
npm i
npm run dev
```
