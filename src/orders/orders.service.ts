import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderStatus } from 'src/enums/orderStatus.enum';
import { PaymentStatus } from 'generated/prisma/enums';

@Injectable()
export class OrdersService {
    constructor(private readonly prisma: PrismaService) {}
    async createOrder(userId: number, createOrderDto: CreateOrderDto){
        const {merchantId, items} = createOrderDto;

        const merchant = await this.prisma.merchant.findUnique({
            where: {
                id: merchantId
            }
        });

        if(!merchant){
            throw new BadRequestException(
                "Merchant tidak ditemukan"
            )
        }

        const productIds = items.map((items)=>items.productId);

        const products = await this.prisma.product.findMany({
            where: {
                id: {
                    in: productIds
                }
            }
        });

        if(products.length !== items.length){
            throw new BadRequestException(
                "Satu atau lebih produk tidak ditemukan"
            )
        }

        const invalidProducts = products.find(
            (product) => product.merchantId !== merchantId
        );

        if(invalidProducts){
            throw new BadRequestException(
                "Produk ini tidak berasal dari toko ini"
            )
        }

        let totalPrice = 0;

        for(const item of items){
            const product = products.find(
                (product) => product.id === item.productId 
            )

            if(!product){
                throw new BadRequestException(
                    "Produk tidak ditemukan"
                )
            }

            totalPrice += product.price * item.quantity;
        }

        const order = await this.prisma.order.create({
            data: {
                buyerId: userId,
                merchantId,
                totalPrice,

                items: {
                    create: items.map((item) => {
                        const product = products.find(
                            (product) => product.id === item.productId
                        )!

                        return {
                            productId: product.id,
                            quantity: item.quantity,
                            price: product.price
                        }
                    })
                }
            },

            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                merchant: true
            }
        });

        return order;
    }

    async pay(orderId: number, file: Express.Multer.File, userId: number){
        const order = await this.prisma.order.findUnique({
            where: {
                id: orderId
            }
        });

        if(!order){
            throw new BadRequestException(
                "Pesanan tidak ditemukan"
            )
        }

        if(order.buyerId !== userId){
            throw new  BadRequestException(
                'Anda tidak dapat mengakses pembayaran ini'
            )
        }

        const payment = await this.prisma.payment.create({
            data: {
                orderId,
                proofPath: file.path,
                uploadedAt: new Date()
            }
        })

        return payment;
    }

    async verifyPayment(orderId: number, userId: number){
        const order = await this.prisma.order.findUnique({
            where: {
                id: orderId,
            },
            include: {
                payment: true,
                merchant: {
                    include: {
                        owner: true
                    }
                }
            }
        });
        if(!order){
            throw new NotFoundException(
                'Pesanan tidak ditemukan'
            )
        }
        if(order.merchant.owner.id !== userId){
            throw new ForbiddenException(
                'Anda tidak bisa akses halaman ini'
            )
        }

        if(order.status !== OrderStatus.WAITING_PAYMENT){
            throw new BadRequestException(
                'Anda tidak bisa melakukan itu pada tahap ini'
            )
        }

        if(!order.payment){
            throw new NotFoundException(
                'Pembayaran belum ada'
            )
        }

        const payment = order.payment;

        return this.prisma.$transaction(async (tx) =>{
            const updatedOrder = await tx.order.update({
                where: {
                    id: orderId
                },
                data: {
                    status: OrderStatus.PAID
                }
            });

            const updatedPayment = await tx.payment.update({
                where: {
                    id: payment.id
                },
                data: {
                    status: PaymentStatus.VERIFIED
                }
            });

            return {
                order: updatedOrder,
                payment: updatedPayment
            };
        });
    }

    async rejectPayment(orderId: number, userId: number) {
        const order = await this.prisma.order.findUnique({
            where: {
                id: orderId
            },
            include: {
                payment: true,
                merchant: {
                    include: {
                        owner: true
                    }
                }
            }
        });

        if(!order) {
            throw new NotFoundException(
                'Order tidak ditemukan'
            )
        }

        if(userId !== order.merchant.ownerId) {
            throw new ForbiddenException(
                'Anda tidak bisa mengakses pesanan ini'
            )
        }

        if(order.status !== OrderStatus.WAITING_PAYMENT){
            throw new BadRequestException(
                'Anda tidak bisa melakukan itu pada tahap ini'
            )
        }

        if(!order.payment){
            throw new NotFoundException(
                'Pembayaran belum ada'
            )
        }

        const payment = order.payment;

        return this.prisma.$transaction(async (tx) => {
            const updatedOrder = await tx.order.update({
                where: {
                    id: orderId
                },
                data: {
                    status: OrderStatus.CANCELLED
                }
            });

            const updatedPayment = await tx.payment.update({
                where: {
                    id: payment.id
                },
                data: {
                    status: PaymentStatus.REJECTED
                }
            });

            return {
                order: updatedOrder,
                payment: updatedPayment
            };
        });
    }

    async orderReady(orderId: number, userId: number){
        const order = await this.prisma.order.findUnique({
            where: {
                id: orderId
            },
            include: {
                merchant: {
                    include: {
                        owner: true
                    }
                }
            }
        });

        if(!order) {
            throw new NotFoundException(
                'Order tidak ditemukan'
            )
        }

        if(userId !== order.merchant.ownerId) {
            throw new ForbiddenException(
                'Anda tidak bisa mengakses pesanan ini'
            )
        }

        if(order.status !== OrderStatus.PAID){
            throw new BadRequestException(
                'Anda tidak bisa melakukan itu pada tahap ini'
            )
        }

        const updatedOrder = await this.prisma.order.update({
            where: {
                id: orderId
            },
            data: {
                status: OrderStatus.READY
            }
        });

        return updatedOrder;
    }

    async orderComplete(orderId: number, userId: number){
        const order = await this.prisma.order.findUnique({
            where: {
                id: orderId
            },
            include: {
                merchant: {
                    include: {
                        owner: true
                    }
                }
            }
        });

        if(!order) {
            throw new NotFoundException(
                'Order tidak ditemukan'
            )
        }

        if(userId !== order.merchant.ownerId) {
            throw new ForbiddenException(
                'Anda tidak bisa mengakses pesanan ini'
            )
        }

        if(order.status !== OrderStatus.READY){
            throw new BadRequestException(
                'Anda tidak bisa melakukan itu pada tahap ini'
            )
        }

        const updatedOrder = await this.prisma.order.update({
            where: {
                id: orderId
            },
            data: {
                status: OrderStatus.COMPLETED
            }
        });

        return updatedOrder;
    }

    async allPurchases(userId: number){
        const orders = await this.prisma.order.findMany({
            where: {
                buyerId: userId
            },
            include: {
                items: true
            }
        });
        return orders;
    }

    async allSales(userId: number){
        const merchant = await this.prisma.merchant.findFirst({
            where: {
                ownerId: userId
            },
        });

        if(!merchant){
            throw new ForbiddenException(
                'Anda tidak memiliki merchant'
            )
        }

        const orders = await this.prisma.order.findMany({
            where: {
                merchantId: merchant.id
            }
        });

        if(!orders){
            throw new NotFoundException(
                'Belum ada pesanan'
            )
        }
        return orders;
    }
}
