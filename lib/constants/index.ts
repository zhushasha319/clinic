export const ENV_APP_NAME = process.env.NEXT_PUBLIC_APP_NAME;
export const App_NAME = ENV_APP_NAME || "Shasha Medical Center";
export const PAGE_SIZE = 5;
export const signInDefaultValues = {
  email: "",
  password: "",
};
export const signUpDefaultValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};
