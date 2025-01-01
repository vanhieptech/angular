import { TestBed } from '@angular/core/testing';
import { MessageModule } from './message.module';
import { MessageService } from './services/message.service';
import { PlatformDetectorService } from './services/platform-detector.service';

describe('MessageModule', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MessageModule.forRoot()],
    });
  });

  it('should provide MessageService', () => {
    const service = TestBed.inject(MessageService);
    expect(service).toBeTruthy();
  });

  it('should provide PlatformDetectorService', () => {
    const service = TestBed.inject(PlatformDetectorService);
    expect(service).toBeTruthy();
  });

  it('should create module', () => {
    const module = TestBed.inject(MessageModule);
    expect(module).toBeTruthy();
  });
});
