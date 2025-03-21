import { serve } from '@hono/node-server'
import { PrismaClient } from '@prisma/client'
import { Hono } from 'hono'

const app = new Hono()
const prisma = new PrismaClient()

app.post("/customer", async (c)=>{
  const {id,name, email, phoneNumber, address} = await c.req.json()
  const customer = await prisma.customers.create({
    data: {
      id,
      name,
      email,
      phoneNumber,
      address
    }
  })
  return c.json(customer)
})

app.get("/customer", async (c)=>{
  const customers = await prisma.customers.findMany()
  return c.json(customers)
})

app.get("/customer/:id", async (c)=>{
  const {id} = c.req.param()
  const customer = await prisma.customers.findUnique({
    where: {
      id: Number(id)
    }
  })
  return c.json(customer)
})

app.post("/restaurant", async (c)=>{
  const {name, location} = await c.req.json();
  const restaurant = await prisma.restaurants.create({
    data: {
      name,
      location
    }
  })
  return c.json(restaurant)
})

app.get("/restaurant", async (c)=>{
  const restaurants = await prisma.restaurants.findMany()
  return c.json(restaurants)
})

app.get("restaurant/:id", async (c)=>{  
  const {id} = c.req.param()
  const restaurant = await prisma.restaurants.findUnique({
    where: {
      id: Number(id)
    }
  })
  return c.json(restaurant)
})

app.post("/restaurants/:id/menu", async (context) => {
  const { id } = context.req.param();
  const { name, price } = await context.req.json();
  try {
    const existRestaurant = await prisma.restaurants.findUnique({
      where: {
        id: Number(id),
      },
    });
    if (!existRestaurant) {
      return context.json({ message: "Restaurant not found" }, 404);
    }

    const menu = await prisma.menuItem.create({
      data: {
        name: name,
        price: price,
        restaurantId: Number(id),
      },
    });
    return context.json(menu, 201);
  } catch (error) {
    console.error("Error finding restaurant", error);
    return context.json({ message: "Error finding restaurant" }, 404);
  }
}); 

app.patch("/menuItem/:id", async (c) => {
  const { id } = c.req.param();
  const { isAvailable, price } = await c.req.json();

  try {
    const existingMenuItem = await prisma.menuItem.findUnique({
      where: { id: Number(id) },
    });

    if (!existingMenuItem) {
      return c.json({ message: "Menu item not found" }, 404);
    }

    const updatedMenuItem = await prisma.menuItem.update({
      where: { id: Number(id) },
      data: {
        price: price,
        isAvailable: isAvailable
      },
    });

    return c.json({ updatedMenuItem }, 200);
  } catch (error) {
    return c.json({ message: "Failed to update menu item" }, 500);
  }
});

app.post("/orders", async (c) => {
  try {
    const { id,customerId, restaurantId, items } = await c.req.json();

    // Validate customer and restaurant
    const customer = await prisma.customers.findUnique({
      where: { id: Number(customerId) },
    });
    const restaurant = await prisma.restaurants.findUnique({
      where: { id: Number(restaurantId) },
    });

    if (!customer) return c.json({ message: "Customer does not exist" }, 400);
    if (!restaurant)
      return c.json({ message: "Restaurant does not exist" }, 400);

    //  Create an Order
    const order = await prisma.order.create({
      data: { customerId, restaurantId, totalPrice: 0 },
    });

    let totalPrice = 0;

    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: Number(item.menuItemId) },
      });

      if (!menuItem || !menuItem.isAvailable) {
        return c.json(
          {
            message: `Menu item ID ${item.menuItemId} not found or unavailable`,
          },
          400
        );
      }

      const itemTotal = Number(menuItem.price) * item.quantity;
      totalPrice += itemTotal;

      // Create OrderItem table
      await prisma.orderItem.create({
        data: {
          
        id:Number(id),
          orderId: order.id,
          menuItemId: menuItem.id,
          quantity: item.quantity,
        },
      });
    }

    // Step 3: Update  totalPrice
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        totalPrice: totalPrice,
        status: "PLACED",
      },
    });

    return c.json({ message: updatedOrder }, 201);
  } catch (error) {
    console.error(error);
    return c.json({ message: "Failed to place order" }, 500);
  }
});


serve(app)
console.log(`Server is running on http://localhost:${3000}`)
