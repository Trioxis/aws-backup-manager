import sinon from 'sinon';
import expect from 'expect.js';
import moment from 'moment';

import {findDeadSnapshots, matchSnapsToVolumes, sortSnapsByMostRecent} from '../src/Analyser';

describe('findDeadSnapshots', () => {
	let clock;
	beforeEach(() => {
		clock = sinon.useFakeTimers();
	});

	afterEach(() => {
		clock.restore();
	});

	it('should filter out snapshots that have expired', () => {
		let firstSnap = {
			Name: 'first',
			SnapshotId: 'snap-00000001',
			FromVolumeId: 'vol-abcdabcd',
			FromVolumeName: 'volume-lol',
			ExpiryDate: moment().subtract(1, 'hours'),
			StartTime: moment(),
			BackupType: 'Daily'
		};
		let secondSnap = {
			Name: 'second',
			SnapshotId: 'snap-00000002',
			FromVolumeId: 'vol-abcdabcd',
			FromVolumeName: 'volume-lol',
			ExpiryDate: moment().add(9, 'hours'),
			StartTime: moment(),
			BackupType: 'Daily'
		};
		let thirdSnap = {
			Name: 'third',
			SnapshotId: 'snap-00000003',
			FromVolumeId: 'vol-abcdabcd',
			FromVolumeName: 'volume-lol',
			ExpiryDate: moment().subtract(1, 'days'),
			StartTime: moment(),
			BackupType: 'Daily'
		};
		let fourthSnap = {
			Name: 'fourth',
			SnapshotId: 'snap-00000004',
			FromVolumeId: 'vol-abcdabcd',
			FromVolumeName: 'volume-lol',
			ExpiryDate: moment().subtract(1, 'months'),
			StartTime: moment(),
			BackupType: 'Daily'
		};
		let fifthSnap = {
			Name: 'last',
			SnapshotId: 'snap-00000005',
			FromVolumeId: 'vol-abcdabcd',
			FromVolumeName: 'volume-lol',
			ExpiryDate: moment().add(7, 'years'),
			StartTime: moment(),
			BackupType: 'Daily'
		};
		let snapList = [firstSnap, secondSnap, thirdSnap, fourthSnap, fifthSnap];

		let filtered = findDeadSnapshots(snapList);
		expect(filtered).to.be.eql([firstSnap, thirdSnap, fourthSnap]);
	});
});

describe('matchSnapsToVolumes', () => {
	it('should attach some snapshots to volumes if their FromVolumeName and Name are the same', () => {
		let now = moment();
		let nowString = moment().format();
		let {matchedVolumes, orphanedSnaps} = matchSnapsToVolumes(
			[{
				VolumeId: 'vol-abcdabcd',
				Name: 'volume-lol',
				BackupConfig: {
					BackupTypes: [
						{
							Name: 'Daily',
							Frequency: 24,
							Expiry: 168
						}
					]
				}
			}],
			[{
				Name: 'snapshot-lol',
				SnapshotId: 'snap-12341234',
				FromVolumeId: 'vol-abcdabcd',
				FromVolumeName: 'volume-lol',
				StartTime: now,
				ExpiryDate: now,
				BackupType: 'Daily'
			}]
		);

		expect(matchedVolumes).to.be.eql([{
			VolumeId: 'vol-abcdabcd',
			Name: 'volume-lol',
			BackupConfig: {
				BackupTypes: [
					{
						Name: 'Daily',
						Frequency: 24,
						Expiry: 168
					}
				]
			},
			Snapshots: {
				Daily: [{
					Name: 'snapshot-lol',
					SnapshotId: 'snap-12341234',
					FromVolumeId: 'vol-abcdabcd',
					FromVolumeName: 'volume-lol',
					StartTime: now,
					ExpiryDate: now,
					BackupType: 'Daily'
				}]
			}
		}])
	});
});


describe('sortSnapsByMostRecent', () => {
	it('should sort an array of snapshots from most to least recently created', () => {
		let now = moment();
		let snapList = [
			{
				Name: 'first',
				SnapshotId: 'snap-00000001',
				FromVolumeId: 'vol-abcdabcd',
				FromVolumeName: 'volume-lol',
				StartTime: moment().subtract(1, 'hours'),
				ExpiryDate: now,
				BackupType: 'Daily'
			},
			{
				Name: 'second',
				SnapshotId: 'snap-00000002',
				FromVolumeId: 'vol-abcdabcd',
				FromVolumeName: 'volume-lol',
				StartTime: moment().subtract(9, 'hours'),
				ExpiryDate: now,
				BackupType: 'Daily'
			},
			{
				Name: 'third',
				SnapshotId: 'snap-00000003',
				FromVolumeId: 'vol-abcdabcd',
				FromVolumeName: 'volume-lol',
				StartTime: moment().subtract(1, 'days'),
				ExpiryDate: now,
				BackupType: 'Daily'
			},
			{
				Name: 'fourth',
				SnapshotId: 'snap-00000004',
				FromVolumeId: 'vol-abcdabcd',
				FromVolumeName: 'volume-lol',
				StartTime: moment().subtract(1, 'months'),
				ExpiryDate: now,
				BackupType: 'Daily'
			},
			{
				Name: 'last',
				SnapshotId: 'snap-00000005',
				FromVolumeId: 'vol-abcdabcd',
				FromVolumeName: 'volume-lol',
				StartTime: moment().subtract(7, 'years'),
				ExpiryDate: now,
				BackupType: 'Daily'
			},
		];

		let sortedList = sortSnapsByMostRecent([
			snapList[2],
			snapList[4],
			snapList[1],
			snapList[0],
			snapList[3]
		]);

		expect(sortedList).to.be.eql(snapList);
	});
});
