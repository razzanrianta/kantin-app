import { 
    Controller, 
    Get, 
    Param, 
    ParseIntPipe, 
    UseGuards, 
    Post, 
    Request, 
    UseInterceptors, 
    BadRequestException, 
    UploadedFile,
    Patch,
    Body,
    Delete
} from '@nestjs/common';
import { MerchantsService } from './merchants.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/enums/role.enum';
import { ApplyMerchantDto } from './dto/apply-merchant.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { CreateProductDto } from './dto/create-product.dto';

@Controller('merchants')
export class MerchantsController {
    constructor(private readonly merchantsService: MerchantsService){}
    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.USER)
    allMerchants() {
        return this.merchantsService.allMerchants();
    }

    @Get('applications')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    allApplications(){
        return this.merchantsService.allApplications(); 
    }

    @Post('application')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @UseInterceptors(FileInterceptor('permitDoc', {
        storage: diskStorage({
            destination: './applicants',
            filename: (
                req, permitDoc, callback
            ) => {
                callback(
                    null,
                    `${Date.now()}-${permitDoc.originalname}`
                );
            },
        }),
        limits: {
            fileSize: 5*1024*1024
        },
        fileFilter: (req, permitDoc, callback) => {
            console.log('MIME TYPE:', permitDoc.mimetype);
            console.log('ORIGINAL NAME:', permitDoc.originalname);
            const allowedTypes = [
                "application/pdf",
                "image/jpeg",
                "image/png"
            ];
            if(allowedTypes.includes(permitDoc.mimetype)){
                callback(null, true);
            }
            else {
                callback(
                    new BadRequestException(
                        "Tipe file anda tidak sesuai"
                    ),
                    false
                )
            }
        }
    }))
    @Roles(Role.USER)
    applyMerchant(
        @Body() applyMerchantDto: ApplyMerchantDto, 
        @Request() req: any,
        @UploadedFile() permitDoc: Express.Multer.File
    ){
        return this.merchantsService.applyMerchant(
            applyMerchantDto,
            req.user.sub,
            permitDoc
        );
    }

    @Patch('applications/:merchantAppId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    addMerchant(
        @Param('merchantAppId', ParseIntPipe) merchantAppId: number,
        @Request() req: any,
    ) {
        return this.merchantsService.addMerchant(merchantAppId, req.user.sub);
    }

    @Get(':merchantId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.USER)
    merchantInfo(@Param('merchantId', ParseIntPipe) id: number) {
        return this.merchantsService.merchantInfo(id);
    }

    @Post(':merchantId/products')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.USER)
    @UseInterceptors(FileInterceptor('image', {
        storage: diskStorage({
            destination: './products',
            filename: (req, image, callback) => {
                callback(
                    null,
                    `${Date.now()}-${image.originalname}`
                );
            },
        }),
        limits: {
            fileSize: 5*1024*1024
        },
        fileFilter: (req, image, callback) => {
            const allowedTypes = [
                'image/jpeg',
                'image/png'
            ];

            if(allowedTypes.includes(image.mimetype)){
                callback(null, true);
            }
            else { 
                callback(
                    new BadRequestException(
                        'Tipe file anda tidak sesuai'
                    ),
                    false
                );
            }
        }
    }))
    addProduct(
        createProductDto: CreateProductDto,
        @Param('merchantId', ParseIntPipe) merchantId: number,
        @Request() req: any,
        @UploadedFile() image: Express.Multer.File
    ) {
        return this.merchantsService.addProduct(
            createProductDto,
            merchantId,
            req.user.sub,
            image
        );
    }

    @Delete(':merchantId/products/:productId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.USER)
    deleteProduct(
        @Param('merchantId', ParseIntPipe) merchantId: number,
        @Param('productId', ParseIntPipe) productId: number,
        @Request() req: any
    ) {
        return this.merchantsService.deleteProduct(
            productId,
            merchantId,
            req.user.sub
        );
    }
}
