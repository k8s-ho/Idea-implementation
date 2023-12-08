from scapy.all import *

def packet_callback(packet, src_filter, dst_filter, interface):
    if packet.haslayer(IP) or packet.haslayer(ARP) or packet.haslayer(ICMP):
        src_ip = packet[IP].src if packet.haslayer(IP) else packet[ARP].psrc
        dst_ip = packet[IP].dst if packet.haslayer(IP) else packet[ARP].pdst
        src_port = packet[TCP].sport if packet.haslayer(TCP) else None
        dst_port = packet[TCP].dport if packet.haslayer(TCP) else None

        if packet.haslayer(TCP):
            proto = "TCP"
        elif packet.haslayer(UDP):
            proto = "UDP"
        elif packet.haslayer(ICMP):
            proto = "ICMP"
            icmp_type = "Request" if packet[ICMP].type == 8 else "Reply"
            payload = None
            if icmp_type == "Request" or icmp_type == "Reply":
                print("[+] Packet Detected:")
                print(f"[{proto}] {src_ip}:{src_port} -> {dst_ip}:{dst_port} ({icmp_type})")
            else:
                print("[+] Packet Detected:")
                print(f"[{proto}] {src_ip} -> {dst_ip}:{dst_port}")
            print("=" * 50)
            return
        elif packet.haslayer(ARP):
            proto = "ARP"
            arp_op = "Request" if packet[ARP].op == 1 else "Reply"
            print("[+] Packet Detected:")
            print(f"[{proto}] {src_ip} -> {dst_ip} ({arp_op})")
            print("=" * 50)
            return
        else:
            proto = "Unknown"

        if not packet.haslayer(Raw) or not hasattr(packet[Raw], 'load'):
            payload = "No payload"
        else:
            payload = packet[Raw].load.decode('utf-8', errors='ignore')

        print("[+] Packet Detected:")
        print(f"[{proto}] {src_ip}:{src_port} -> {dst_ip}:{dst_port}\n")
        print(payload)
        print("=" * 50)

src_ip_filter = input("Enter source IP address to filter (or press Enter to skip): ").strip()
dst_ip_filter = input("Enter destination IP address to filter (or press Enter to skip): ").strip()
interface = input("Enter the interface name (or press Enter to use default 'eth0'): ").strip() or "eth0"
print(f"Sniffing on interface: {interface}")
sniff(iface=interface, prn=lambda x: packet_callback(x, src_ip_filter, dst_ip_filter, interface), store=0)
