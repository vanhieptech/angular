import { TestBed } from '@angular/core/testing';
import { MessageService } from './message.service';
import { MessageBridgeFactory } from './message-bridge.factory';
import { PlatformDetectorService } from './platform-detector.service';
import { Message } from '../interfaces/message.interface';

describe('MessageService', () => {
  let service: MessageService;
  let platformDetector: PlatformDetectorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MessageService,
        MessageBridgeFactory,
        PlatformDetectorService,
      ],
    });

    service = TestBed.inject(MessageService);
    platformDetector = TestBed.inject(PlatformDetectorService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should handle messages with type filtering', (done) => {
    const testMessage: Message = {
      type: 'TEST',
      payload: { data: 'test' },
      source: 'browser',
    };

    service.onMessage('TEST').subscribe((message) => {
      expect(message).toEqual(testMessage);
      done();
    });

    window.postMessage(testMessage, window.location.origin);
  });
});
