import ollama

SERVER_IP = "192.168.1.80" 
client = ollama.Client(host=f'http://{SERVER_IP}:11434')

# Changed 3.1 to 3.2 to match what you have on the NUC
response = client.chat(model='llama3.2:3b', messages=[
  {
    'role': 'user',
    'content': 'Will the world end one day?',
  },
])

print(response['message']['content'])