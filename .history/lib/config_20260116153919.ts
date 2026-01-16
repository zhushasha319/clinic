export function getAppTimeZone(): string {
const defaultTimeZone = "Asia/Shanghai";
return process.env.APP_TIMEZONE || defaultTimeZone;
}