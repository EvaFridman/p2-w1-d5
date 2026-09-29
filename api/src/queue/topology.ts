import { Channel } from 'amqplib';

export async function setupTopology(channel: Channel) {
  await channel.assertExchange('portal', 'topic', { durable: true });
  await channel.assertExchange('portal.dead', 'topic', { durable: true });

  await channel.assertQueue('mail', {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': 'portal.dead',
      'x-dead-letter-routing-key': 'mail.dead',
    },
  });
  await channel.bindQueue('mail', 'portal', 'viewing.#');
  await channel.bindQueue('mail', 'portal', 'listing.expired');
  await channel.bindQueue('mail', 'portal', 'agent.digest');

  await channel.assertQueue('mail.dead', { durable: true });
  await channel.bindQueue('mail.dead', 'portal.dead', 'mail.dead');

  await channel.assertQueue('activity', { durable: true });
  await channel.bindQueue('activity', 'portal', '#');
}
