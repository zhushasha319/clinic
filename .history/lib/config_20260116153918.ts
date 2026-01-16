export function getAppTimeZone(): string {
const defaultTimeZone = "Asia/";
return process.env.APP_TIMEZONE || defaultTimeZone;
}