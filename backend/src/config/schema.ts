import {
  mysqlTable,
  mysqlEnum,
  int,
  varchar,
  text,
  timestamp,
  boolean,
} from "drizzle-orm/mysql-core";

export const USER_ROLES = ["user", "admin"] as const;
export const BOOKING_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "completed",
  "cancelled",
] as const;
export const CARE_TYPES = [
  "feeding",
  "bathing",
  "playtime",
  "health_check",
] as const;

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 50 }).notNull(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  role: mysqlEnum("role", USER_ROLES).notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cages = mysqlTable("cages", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  price: int("price").notNull(),
  description: text("description"),
  acceptedTypes: varchar("accepted_types", { length: 255 })
    .notNull()
    .default("[]"),
  isAvailable: boolean("is_available").notNull().default(true),
  imageUrl: varchar("image_url", { length: 255 }).notNull(),
  imagePublicId: varchar("image_public_id", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const services = mysqlTable("services", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  price: int("price").notNull(),
  description: text("description"),
  imageUrl: varchar("image_url", { length: 255 }),
  imagePublicId: varchar("image_public_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bookings = mysqlTable("bookings", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id),
  cageId: int("cage_id")
    .notNull()
    .references(() => cages.id),
  serviceId: int("service_id").references(() => services.id, {
    onDelete: "set null",
  }),
  petName: varchar("pet_name", { length: 100 }).notNull(),
  petType: varchar("pet_type", { length: 50 }).notNull(),
  petDescription: text("pet_description"),
  petImageUrl: varchar("pet_image_url", { length: 255 }),
  petImagePublicId: varchar("pet_image_public_id", { length: 255 }),
  checkInDate: varchar("check_in_date", { length: 30 }).notNull(),
  checkOutDate: varchar("check_out_date", { length: 30 }).notNull(),
  durationDays: int("duration_days").notNull(),
  totalPrice: int("total_price").notNull(),
  status: mysqlEnum("status", BOOKING_STATUSES).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bookingStatusHistory = mysqlTable("booking_status_history", {
  id: int("id").primaryKey().autoincrement(),
  bookingId: int("booking_id")
    .notNull()
    .references(() => bookings.id),
  status: mysqlEnum("status", [
    "pending",
    "approved",
    "rejected",
    "completed",
    "cancelled",
  ]).notNull(),
  note: varchar("note", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const careUpdates = mysqlTable("care_updates", {
  id: int("id").primaryKey().autoincrement(),
  bookingId: int("booking_id")
    .notNull()
    .references(() => bookings.id),
  staffId: int("staff_id")
    .notNull()
    .references(() => users.id),
  type: mysqlEnum("type", CARE_TYPES).notNull(),
  note: varchar("note", { length: 255 }),
  photoUrl: varchar("photo_url", { length: 255 }).notNull(),
  photoPublicId: varchar("photo_public_id", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
