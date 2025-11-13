import { DataService } from './DataService';
import { getStorage, ref, uploadString } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

export class BackupService {
  static async exportDataToJSON() {
    const tasks = await DataService.getAll('tasks');
    const habits = await DataService.getAll('habits');
    const golfSessions = await DataService.getAll('golfSessions');
    return JSON.stringify({ tasks, habits, golfSessions });
  }

  static async triggerBackup() {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    const storage = getStorage();
    const backupJson = await this.exportDataToJSON();
    const backupRef = ref(storage, `backups/${user.uid}/lifesync_backup.json`);
    await uploadString(backupRef, backupJson, 'raw');
    return true;
  }
}
