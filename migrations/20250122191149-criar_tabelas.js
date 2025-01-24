/*
  # Initial Schema for MÓcardápio

  1. Tables
    - Users
    - Kitchens
    - DeliveryPersons
    - Customers
    - Dishes
    - Orders
    - OrderItems
    - Messages

  2. Enums
    - user_type: kitchen, customer, delivery, admin, customer_service
    - order_status: pending, accepted, preparing, ready, delivering, delivered, cancelled

  3. Security
    - Enable RLS on all tables
    - Add policies for data access
*/

-- Create enum types
CREATE TYPE user_type AS ENUM ('kitchen', 'customer', 'delivery', 'admin', 'customer_service');
CREATE TYPE order_status AS ENUM ('pending', 'accepted', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled');

-- Create Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  type user_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create Kitchens table
CREATE TABLE IF NOT EXISTS kitchens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  specialty TEXT NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create DeliveryPersons table
CREATE TABLE IF NOT EXISTS delivery_persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  vehicle TEXT NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create Customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create Dishes table
CREATE TABLE IF NOT EXISTS dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kitchen_id UUID NOT NULL REFERENCES kitchens(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  kitchen_id UUID NOT NULL REFERENCES kitchens(id),
  delivery_person_id UUID REFERENCES delivery_persons(id),
  status order_status DEFAULT 'pending',
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create OrderItems table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  dish_id UUID NOT NULL REFERENCES dishes(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id),
  receiver_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchens ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Users can read their own data
CREATE POLICY users_read_own ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Kitchens can read/update their own data
CREATE POLICY kitchens_manage_own ON kitchens
  FOR ALL
  USING (auth.uid() = user_id);

-- Delivery persons can read/update their own data
CREATE POLICY delivery_persons_manage_own ON delivery_persons
  FOR ALL
  USING (auth.uid() = user_id);

-- Customers can read/update their own data
CREATE POLICY customers_manage_own ON customers
  FOR ALL
  USING (auth.uid() = user_id);

-- Dishes policies
CREATE POLICY dishes_read_all ON dishes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY dishes_manage_kitchen ON dishes
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM kitchens k
    WHERE k.id = kitchen_id
    AND k.user_id = auth.uid()
  ));

-- Orders policies
CREATE POLICY orders_read_own ON orders
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM customers WHERE id = customer_id
      UNION
      SELECT user_id FROM kitchens WHERE id = kitchen_id
      UNION
      SELECT user_id FROM delivery_persons WHERE id = delivery_person_id
    )
  );

-- Order items policies
CREATE POLICY order_items_read_related ON order_items
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_id
    AND (
      EXISTS (SELECT 1 FROM customers c WHERE c.id = o.customer_id AND c.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM kitchens k WHERE k.id = o.kitchen_id AND k.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM delivery_persons d WHERE d.id = o.delivery_person_id AND d.user_id = auth.uid())
    )
  ));

-- Messages policies
CREATE POLICY messages_manage_own ON messages
  FOR ALL
  USING (auth.uid() IN (sender_id, receiver_id));