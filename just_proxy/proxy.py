import socket
import threading

def print_packet_data(data, direction):
    print(f"=== {direction} Packet ===")
    print(data.decode('utf-8', errors='ignore'))
    print("=" * 30)

def handle_client(client_socket, server_ip, server_port):
    request = client_socket.recv(4096)
    print_packet_data(request, "Client to Proxy")

    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.connect((server_ip, server_port))

    server_socket.sendall(request)

    response = server_socket.recv(4096)
    print_packet_data(response, "Proxy to Server")

    client_socket.sendall(response)

    client_socket.close()
    server_socket.close()

def start_proxy(proxy_port, server_ip, server_port):
    proxy_server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    proxy_server.bind(('0.0.0.0', proxy_port))
    proxy_server.listen(5)
    print(f"=== Proxy Server Listening on Port {proxy_port} ===")

    while True:
        client_socket, addr = proxy_server.accept()
        print(f"Accepted Connection from {addr[0]}:{addr[1]}")

        client_handler = threading.Thread(
            target=handle_client,
            args=(client_socket, server_ip, server_port)
        )
        client_handler.start()

if __name__ == "__main__":
    proxy_port = 7777

    server_ip = input("Enter the Server IP: ")
    server_port = int(input("Enter the Server Port: "))

    start_proxy(proxy_port, server_ip, server_port)
