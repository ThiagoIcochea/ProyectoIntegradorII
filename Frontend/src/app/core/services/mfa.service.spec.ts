import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MfaService } from './mfa.service';

describe('MfaService modal prompts', () => {
  afterEach(() => vi.restoreAllMocks());

  it('solicita un codigo de seis digitos con el diseno MFA', async () => {
    const service = new MfaService({} as HttpClient);
    const fire = vi.spyOn(Swal, 'fire').mockResolvedValue({
      isConfirmed: true,
      isDenied: false,
      value: '123456'
    } as any);

    const code = await (service as any).promptForCode('correo');

    expect(code).toBe('123456');
    expect(fire).toHaveBeenCalledWith(expect.objectContaining({
      buttonsStyling: false,
      customClass: expect.objectContaining({
        popup: 'mfa-swal-popup',
        input: 'mfa-swal-input'
      }),
      inputAttributes: expect.objectContaining({ maxlength: '6' })
    }));
  });

  it('respeta la cancelacion al elegir el canal MFA', async () => {
    const service = new MfaService({} as HttpClient);
    vi.spyOn(Swal, 'fire').mockResolvedValue({ isConfirmed: false, value: null } as any);

    await expect((service as any).resolveMethod()).rejects.toThrow('cancelada');
  });
});
