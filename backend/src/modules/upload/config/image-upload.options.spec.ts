import { BadRequestException } from '@nestjs/common';
import { IMAGE_UPLOAD_OPTIONS } from './image-upload.options';

describe('IMAGE_UPLOAD_OPTIONS', () => {
  const runFilter = (mimetype: string) => new Promise<boolean>((resolve, reject) => {
    IMAGE_UPLOAD_OPTIONS.fileFilter?.({} as never, { mimetype } as Express.Multer.File, (error, accepted) => error ? reject(error) : resolve(accepted));
  });

  it.each(['image/jpeg', 'image/png', 'image/webp'])('chấp nhận %s', async (mimetype) => {
    await expect(runFilter(mimetype)).resolves.toBe(true);
  });

  it('từ chối SVG hoặc file không phải ảnh', async () => {
    await expect(runFilter('image/svg+xml')).rejects.toBeInstanceOf(BadRequestException);
    await expect(runFilter('application/javascript')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('giới hạn một file tối đa 5MB', () => {
    expect(IMAGE_UPLOAD_OPTIONS.limits).toEqual(expect.objectContaining({ files: 1, fileSize: 5 * 1024 * 1024 }));
  });
});
