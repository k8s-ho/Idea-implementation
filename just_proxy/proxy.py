import socket
import threading

def handle_client(client_socket, server_ip, server_port):
    request = client_socket.recv(4096)

    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.connect((server_ip, server_port))

    server_socket.sendall(request)

    response = server_socket.recv(4096)
    client_socket.sendall(response)

    client_socket.close()
    server_socket.close()

def start_proxy(proxy_port, server_ip, server_port):
    proxy_server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    proxy_server.bind(('0.0.0.0', proxy_port))
    proxy_server.listen(5)
    print(f"Proxy server listening on port {proxy_port}")

    while True:
        client_socket, addr = proxy_server.accept()
        print(f"Accepted connection from {addr[0]}:{addr[1]}")

        client_handler = threading.Thread(
            target=handle_client,
            args=(client_socket, server_ip, server_port)
        )
        client_handler.start()

if __name__ == "__main__":
    proxy_port = 7777

    server_ip = input("Enter the server IP: ")
    server_port = int(input("Enter the server port: "))

    start_proxy(proxy_port, server_ip, server_port)
