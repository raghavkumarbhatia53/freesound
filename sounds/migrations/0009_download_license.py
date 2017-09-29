# -*- coding: utf-8 -*-
# Generated by Django 1.11 on 2017-07-12 12:53
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('sounds', '0008_soundoftheday'),
    ]

    operations = [
        migrations.AddField(
            model_name='download',
            name='license',
            field=models.ForeignKey(blank=True, default=None, null=True, on_delete=django.db.models.deletion.CASCADE, to='sounds.License'),
        ),
        migrations.RunSQL('create index if not exists sounds_download_user_sound on sounds_download(user_id, sound_id) WHERE pack_id IS NULL;'),
        migrations.RunSQL('create index if not exists sounds_download_user_pack on sounds_download(user_id, pack_id) WHERE sound_id IS NULL;'),
        migrations.RunSQL('drop index if exists sounds_download_user_pack_unique;'),
        migrations.RunSQL('drop index if exists sounds_download_user_sound_unique;'),
    ]
