import { IsBoolean, IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional() @IsString() @MinLength(2, { message: 'Enter the business name.' }) @MaxLength(120) businessName?: string;
  @IsOptional() @IsString() @MaxLength(120) contactName?: string;

  @IsOptional()
  @ValidateIf((o: UpdateSettingsDto) => o.phone !== null && o.phone !== '')
  @Matches(/^[0-9+()\-.\s]{7,24}$/, { message: 'Enter a phone number using digits, spaces, or + ( ) -.' })
  phone?: string | null;

  @IsOptional()
  @ValidateIf((o: UpdateSettingsDto) => o.email !== null && o.email !== '')
  @IsEmail({}, { message: 'Enter an email address in the format name@company.com.' })
  email?: string | null;

  @IsOptional() @ValidateIf((o: UpdateSettingsDto) => o.addressLine1 !== null) @IsString() @MaxLength(160) addressLine1?: string | null;
  @IsOptional() @ValidateIf((o: UpdateSettingsDto) => o.addressLine2 !== null) @IsString() @MaxLength(160) addressLine2?: string | null;
  @IsOptional() @IsString() @MaxLength(160) tagline?: string;
  @IsOptional() @IsString() @MaxLength(4000, { message: 'Use 4,000 characters or fewer.' }) companyProfile?: string;
  @IsOptional() @IsString() @MaxLength(20000, { message: 'Use 20,000 characters or fewer.' }) privacyPolicy?: string;
  @IsOptional() @IsString() @MaxLength(20000, { message: 'Use 20,000 characters or fewer.' }) termsOfUse?: string;
  @IsOptional() @IsString() @MaxLength(600) reviewNote?: string;
  @IsOptional() @IsBoolean() inquiriesOpen?: boolean;
  @IsOptional() @IsBoolean() applicationsOpen?: boolean;
}
