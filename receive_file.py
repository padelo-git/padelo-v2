import base64
content = input()
decoded = base64.b64decode(content)
with open('frontend/src/pages/ClubPanel.jsx', 'wb') as f:
    f.write(decoded)
print("OK")
