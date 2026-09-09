import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '../enums/role.enum';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService
    ) {}

    async register(registerDto: RegisterDto) {
        const {username, email, password} = registerDto;

        const existingUser = await this.prisma.user.findUnique({
            where: {
                email
            }
        });

        if (existingUser) {
            throw new ConflictException(
                'User ini sudah ada'
            );
        }

        const hashedPass = await bcrypt.hash(
            password,
            10
        );

        const user = await this.prisma.user.create({
            data: {
                email,
                username,
                password: hashedPass,
                role: Role.USER
            }
        });

        return {
            id: user.id,
            email: user.email,
            role: user.role
        };
    }

    async login(loginDto: LoginDto){
        const user = await this.prisma.user.findUnique({
            where: {
                email: loginDto.email
            },
        });

        if(!user) {
            throw new UnauthorizedException(
                "Email atau password salah"
            );
        }

        const passValid = await bcrypt.compare(
            loginDto.password,
            user.password,
        );

        if(!passValid){
            throw new UnauthorizedException(
                "Email atau password salah"
            );
        }
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role
        };

        const accessToken = await this.jwtService.signAsync(
            payload
        );

        return {
            access_token: accessToken
        };
    }

    async getMe(userId: number){
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            },
            select: {
                id: true,
                username: true,
                role: true,
                email: true,
                merchants: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }

        })

        return user;
    }
}
