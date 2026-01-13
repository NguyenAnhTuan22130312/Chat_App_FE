// src/utils/dateUtils.ts

export const parseDate = (dateString?: string): Date => {
    if (!dateString) return new Date();
    let isoTime = dateString;
    if (!isoTime.endsWith('Z')) isoTime = isoTime + 'Z';
    return new Date(isoTime);
};

export const formatMessageTime = (dateString?: string) => {
    const date = parseDate(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

export const formatSeparatorTime = (dateString?: string) => {
    const date = parseDate(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${hours}:${minutes} ${day}/${month}/${year}`;
};