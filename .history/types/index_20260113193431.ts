export interface ServerActionResponse <T=any>{
  success: boolean;
  data?: <T>;
  error?: string;
}