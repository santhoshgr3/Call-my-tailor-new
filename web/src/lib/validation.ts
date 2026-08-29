import { z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(60),
  lastName: z.string().max(60).optional().or(z.literal("")),
  email: z.string().email("Enter a valid email"),
  phone: z.string().max(20).optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const bookingSchema = z.object({
  name: z.string().min(1).max(80),
  phone: z.string().min(6).max(20),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().min(1).max(300),
  city: z.string().max(80).optional().or(z.literal("")),
  pincode: z.string().max(12).optional().or(z.literal("")),
  category: z.string().max(80).optional().or(z.literal("")),
  preferredDate: z.string().max(40).optional().or(z.literal("")),
  preferredTime: z.string().max(40).optional().or(z.literal("")),
  message: z.string().max(1000).optional().or(z.literal("")),
});

export const contactSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  phone: z.string().max(20).optional().or(z.literal("")),
  subject: z.string().max(120).optional().or(z.literal("")),
  message: z.string().min(1).max(2000),
});

export const checkoutSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(6).max(20),
  fullName: z.string().min(1).max(80),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional().or(z.literal("")),
  city: z.string().min(1).max(80),
  state: z.string().min(1).max(80),
  pincode: z.string().min(4).max(12),
  paymentMethod: z.enum(["cod", "razorpay"]),
  couponCode: z.string().max(40).optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
  items: z
    .array(
      z.object({
        productId: z.string(),
        qty: z.number().int().min(1).max(50),
        options: z.record(z.string(), z.string()).optional(),
      }),
    )
    .min(1),
});

export const reviewSchema = z.object({
  productId: z.string(),
  customerName: z.string().min(1).max(80),
  email: z.string().email().optional().or(z.literal("")),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(120).optional().or(z.literal("")),
  body: z.string().min(1).max(2000),
});
