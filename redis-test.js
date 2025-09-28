const redis = require("./redis");
async function run() {
  // SET & GET
  await redis.set("name", "Nithish");
  const name = await redis.get("name");
  console.log("GET name:", name); // Output: Nithish

  // LPUSH & RPOP (list operations)
  await redis.lpush("tasks", "Task1");
  await redis.lpush("tasks", "Task2");
  await redis.lpush("tasks", "Task3");

  const task1 = await redis.rpop("tasks");
  const task2 = await redis.rpop("tasks");
  console.log("Tasks in queue:");
  for (let i = 0; i < (await redis.llen("tasks")); i++) {
    console.log(await redis.lindex("tasks", i));
  }
  console.log("Popped tasks:", task1, task2); // FIFO from list
}

run().then(() => process.exit(0));
