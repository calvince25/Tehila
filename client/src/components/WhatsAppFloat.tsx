import { MessageCircle } from "lucide-react";

const whatsappUrl = "https://wa.me/254113448688?text=Hi%20Tehila%2C%20I%27d%20love%20to%20ask%20about%20your%20Threaded%20Forms%20studio.";

export default function WhatsAppFloat() {
  return (
    <a
      className="whatsapp-float"
      href={whatsappUrl}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with Tehila on WhatsApp"
      title="Chat on WhatsApp"
    >
      <MessageCircle size={23} strokeWidth={2.2} />
      <span>Chat with Tehila</span>
    </a>
  );
}
