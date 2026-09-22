import { 
    BadRequestException, 
    Body, 
    Controller, 
    Get, 
    Param, 
    ParseIntPipe, 
    Patch, 
    Post, 
    Request, 
    UploadedFile, 
    UseGuards, 
    UseInterceptors 
} from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Role } from 'src/enums/role.enum';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService){}

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.USER)
    createOrder(@Request() req: any, @Body() createOrderDto: CreateOrderDto) {
        return this.ordersService.createOrder(req.user.sub, createOrderDto);
    }

    @Get('purchases')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.USER)
    allPurchases(@Request() req: any){
        return this.ordersService.allPurchases(req.user.sub);
    }

    @Get(':orderId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.USER)
    oneOrder(@Request() req: any, @Param('orderId',ParseIntPipe) orderId: number){
        return this.ordersService.oneOrder(
            req.user.sub,
            orderId
        )
    }

    @Post(':orderId/payment')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.USER)
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads/payments',
            filename: (
                req,
                file,
                callback
            ) => {
                callback(
                    null,
                    `${Date.now()}-${file.originalname}`,
                );
            },
        }),
        limits: {
            fileSize: 5*1024*1024
        },
        fileFilter: (req, file, callback) => {
            const allowedTypes = [
                'application/pdf',
                'image/jpeg',
                'image/png'
            ];

            if(allowedTypes.includes(file.mimetype)){
                callback(null, true)
            }
            else{
                callback(
                    new BadRequestException(
                        'Format file harus pdf, jpg, atau png'
                    ),
                    false
                );
            }
        }
    }))
    pay(
        @Param('orderId', ParseIntPipe) orderId: number,
        @UploadedFile() file: Express.Multer.File,
        @Request() req: any
    ){
        return this.ordersService.pay(
            orderId,
            file,
            req.user.sub
        )
    }
    @Patch(':orderId/payment/verify')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.USER)
    verifyPayment(
        @Param('orderId', ParseIntPipe) orderId: number,
        @Request() req: any
    ) {
        return this.ordersService.verifyPayment(
            orderId,
            req.user.sub
        )
    }

    @Patch(':orderId/payment/reject')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.USER)
    rejectPayment(
        @Param('orderId', ParseIntPipe) orderId: number,
        @Request() req: any
    ) {
        return this.ordersService.rejectPayment(
            orderId,
            req.user.sub
        );
    }

    @Patch(':orderId/ready')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.USER)
    orderReady(
        @Param('orderId', ParseIntPipe) orderId: number,
        @Request() req: any
    ) {
        return this.ordersService.orderReady(
            orderId,
            req.user.sub
        );
    }

    @Patch(':orderId/complete')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.USER)
    orderComplete(
        @Param('orderId', ParseIntPipe) orderId: number,
        @Request() req: any
    ) {
        return this.ordersService.orderComplete(
            orderId,
            req.user.sub
        );
    }
}