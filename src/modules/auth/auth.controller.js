import { signup, login } from './auth.service.js';
import { SignupSchema, LoginSchema } from './auth.schema.js';

export const signupController = async (req, res, next) => {
  try {
    // validate 
    const validatedData = SignupSchema.parse(req.body);

    // fetch 
    const user = await signup(validatedData);

    //return
    return res.status(201).json({
      success: true,
      data: user,
      error: null,
    });
  }
  catch (error) {
    next(error);
  }
};

export const loginController = async (req, res, next) => {
  try {
    // validate 
    const validatedData = LoginSchema.parse(req.body);

    // fetch 
    const result = await login(validatedData);

    //return
    return res.status(200).json({
      success: true,
      data: result,
      error: null,
    });
  }
  catch (error) {
    next(error);
  }
};
