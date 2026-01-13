export interface ServerActionResponse <T=any>{
  success: boolean;
  message?: string;
  data?: T
  error?: string;
  err
}