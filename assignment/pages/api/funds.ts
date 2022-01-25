// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  try {
    let formData = req.body;
    if ( typeof req.body === 'object' || Array.isArray(req.body) ) {
      formData = JSON.stringify(req.body)
    }
    await prisma.funds.deleteMany({});
    const savedData = await prisma.funds.create({ data: {data: formData} });
    res.status(200).json(savedData);
  } catch (err) {
    res.status(400).json({ message: 'Something went wrong' });
  }
}
