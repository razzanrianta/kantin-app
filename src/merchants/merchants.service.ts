import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MerchantStatus } from 'src/enums/merchantStatus.enum';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApplyMerchantDto } from './dto/apply-merchant.dto';
import { MerchantApplicationStatus } from 'src/enums/merchantApplication.enum';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class MerchantsService {
    constructor (private readonly prisma:PrismaService){}

    // ini pada halaman utama aplikasi daftar semua toko toko
    async allMerchants() {
        const all = await this.prisma.merchant.findMany({
            where: {
                status: MerchantStatus.ACTIVE,
            },
        });

        return all;
    }

    // ini ketika user menekan sebuah toko lalu diarahkan nanti ke detail toko
    async merchantInfo(id: number) {
        const merchant = await this.prisma.merchant.findUnique({
            where: {
                id
            },
            include: {
                products: true
            },
        });

        if(!merchant){
            throw new NotFoundException(
                "Toko tidak ditemukan"
            );
        }

        return merchant;
    }

    async applyMerchant(dto: ApplyMerchantDto, applicantId: number, file: Express.Multer.File){
        const {name, description, location, phone} = dto;
        return this.prisma.merchantApplication.create({
            data: {
                name,
                description,
                location,
                phone,
                permitDoc: file.path,
                applicantId
            },
        });
    }

    async addMerchant(merchantAppId: number, adminId: number){
        const merchantApp = await this.prisma.merchantApplication.findUnique({
            where: {
                id: merchantAppId
            },
            include: {
                applicant: true
            }
        });

        if(!merchantApp) {
            throw new NotFoundException(
                "Pengajuan toko anda tidak ditemukan"
            )
        }

        const {name, description, location, phone} = merchantApp;
        const ownerId = merchantApp.applicant.id;

        return this.prisma.$transaction(async (tx) => {
            const updatedApp = await tx.merchantApplication.update({
                where: {
                    id: merchantAppId
                },
                data: {
                    status: MerchantApplicationStatus.APPROVED,
                    reviewerId: adminId
                }
            });

            const newMerchant = await tx.merchant.create({
                data: {
                    name,
                    description,
                    location,
                    phone,
                    ownerId
                }
            });

            return {
                approved: updatedApp,
                merchant: newMerchant
            };
        });
    }

    async allApplications(){
        return this.prisma.merchantApplication.findMany({
            where: {
                status: MerchantApplicationStatus.UNDER_REVIEW
            }
        })
    }

    async addProduct(
        dto: CreateProductDto, merchantId: number, userId: number, image: Express.Multer.File
    ){
        const {name, price} = dto;
        const merchant = await this.prisma.merchant.findUnique({
            where: {
                id: merchantId
            }
        });

        if(!merchant){
            throw new NotFoundException(
                "Toko ini tidak ditemukan"
            )
        }

        if(merchant.ownerId!==userId){
            throw new ForbiddenException(
                'Anda tidak bisa mengakses toko ini'
            )
        }

        return this.prisma.product.create({
            data: {
                name,
                price,
                merchantId,
                image: image.path
            },
        });
    }

    async deleteProduct(productId: number, merchantId: number, userId: number){
        const product = await this.prisma.product.findUnique({
            where: {
                id: productId,
                merchantId
            },
            include: {
                merchant: true
            }
        });

        if(!product){
            throw new NotFoundException(
                'Produk tidak ditemukan'
            )
        }

        if(product.merchant.ownerId!==userId){
            throw new ForbiddenException(
                'Anda tidak bisa mengakses ini'
            )
        }

        return this.prisma.product.delete({
            where: {
                id:productId
            }
        });
    }
}
