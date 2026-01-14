import { ChatMessage } from '../store/slices/chatSlice';

export function formatReplyMessage(replyTo: ChatMessage, messageContent: string): string {
    const replyData = {
        sender: replyTo.name,
        msg: replyTo.mes.substring(0, 100),
        time: replyTo.createAt || '',
    };
    
    const replyPrefix = `[REPLY:${JSON.stringify(replyData)}]`;
    return `${replyPrefix}\n${messageContent}`;
}

export function parseReplyMessage(mes: string): { 
    replyTo: ChatMessage['replyTo'] | null; 
    mes: string 
} {
    if (!mes.startsWith('[REPLY:')) {
        return { replyTo: null, mes };
    }
    
    try {
        const jsonStart = mes.indexOf('{', 7);
        if (jsonStart === -1) {
            return { replyTo: null, mes };
        }

        let braceCount = 0;
        let jsonEnd = -1;
        for (let i = jsonStart; i < mes.length; i++) {
            if (mes[i] === '{') braceCount++;
            if (mes[i] === '}') braceCount--;
            if (braceCount === 0) {
                jsonEnd = i;
                break;
            }
        }
        
        if (jsonEnd === -1) {
            return { replyTo: null, mes };
        }

        const jsonStr = mes.substring(jsonStart, jsonEnd + 1);
        const replyData = JSON.parse(jsonStr);
        
        const closingBracket = mes.indexOf(']', jsonEnd);
        const actualMessage = closingBracket !== -1 
            ? mes.substring(closingBracket + 1).replace(/^\s+/, '') 
            : '';
        
        return {
            replyTo: {
                senderName: replyData.sender,
                message: replyData.msg,
                timestamp: replyData.time,
            },
            mes: actualMessage,
        };
    } catch (e) {
        console.error('Error parsing reply data:', e);
        return { replyTo: null, mes };
    }
}

export function truncateMessage(message: string, maxLength: number = 50): string {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
}
