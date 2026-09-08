import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { componentTestProviders } from '../../testing/component-test.providers';
import { VoiceAssistantComponent } from './voice-assistant';

describe('Voice assistant status', () => {
  afterEach(() => vi.useRealTimers());

  it('fades, clears the message, and starts a fresh duration for the next answer', async () => {
    TestBed.configureTestingModule({ imports: [VoiceAssistantComponent], providers: componentTestProviders });
    const fixture = TestBed.createComponent(VoiceAssistantComponent);
    await fixture.whenStable();
    vi.useFakeTimers();
    const component = fixture.componentInstance;
    component.answer = 'Primera respuesta';
    (component as any).showVoiceStatus();
    await vi.advanceTimersByTimeAsync(4000);
    component.answer = 'Nueva respuesta';
    (component as any).showVoiceStatus();
    await vi.advanceTimersByTimeAsync(1000);
    expect(component.statusVisible).toBe(true);
    await vi.advanceTimersByTimeAsync(4000);
    expect(component.statusVisible).toBe(false);
    expect(component.statusRendered).toBe(true);
    await vi.advanceTimersByTimeAsync(260);
    expect(component.statusRendered).toBe(false);
    expect(component.answer).toBe('');
    fixture.destroy();
  });
});
