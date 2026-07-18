// ── BRAINS AI GLOBAL SECURITY CHECK ─────────────────────────────────
(function () {
    const EXEMPT = ['maintenance', 'index'];
    const AUTH_URL = 'https://gjznwgzoqpfdnxywixgv.supabase.co/functions/v1/auth-proxy';

    function showLockdown() {
        document.open();
        document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>System Locked | BRAINS AI</title><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0a0f0d;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:Segoe UI,sans-serif;color:white;padding:20px}.box{text-align:center;max-width:460px;width:100%;background:#0f1f15;border:1px solid rgba(255,68,68,.35);border-radius:20px;padding:50px 28px}.icon{font-size:3.5rem;margin-bottom:16px}h1{color:#ff4444;font-size:1.7rem;margin-bottom:12px}p{color:rgba(255,255,255,.6);line-height:1.75;font-size:.92rem}.badge{display:inline-block;margin-top:22px;padding:7px 18px;background:rgba(255,68,68,.1);border:1px solid rgba(255,68,68,.4);border-radius:50px;color:#ff6b6b;font-size:.75rem;letter-spacing:2px;text-transform:uppercase;font-weight:700}.retry{margin-top:22px;display:inline-block;padding:11px 26px;background:none;border:1px solid rgba(255,255,255,.2);border-radius:10px;color:rgba(255,255,255,.45);font-size:.82rem;cursor:pointer;transition:.2s}.retry:hover{border-color:rgba(255,255,255,.5);color:#fff}</style></head><body><div class=box><div class=icon>&#128274;</div><h1>System Locked</h1><p>BRAINS AI is currently under administrative lockdown.<br>All student and bursary access has been suspended.<br><br>Please contact the ICT department for assistance.</p><div class=badge>&#9888;&nbsp; Maintenance Mode Active</div><br><br><button class=retry onclick="location.reload()">&#8635;&nbsp; Check Again</button></div></body></html>');
        document.close();
    }

    async function checkStatus() {
        const path = window.location.pathname.toLowerCase();
        if (EXEMPT.some(p => path.includes(p))) return;
        try {
            const resp = await fetch(AUTH_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'check-system-status' })
            });
            if (resp.status === 503) {
                showLockdown();
                return;
            }
            const data = await resp.json();
            if (data.error === 'MAINTENANCE_MODE') {
                showLockdown();
            }
        } catch (e) {
            console.warn('BRAINS: security check skipped -', e.message);
        }
    }
    checkStatus();
    setInterval(checkStatus, 30000);
}());

// ── BRAINS AI INSTITUTION BRANDING (used on generated documents) ──────
const INSTITUTION_NAME = "NIGER-NORTH COLLEGE OF HEALTH SCIENCE AND TECHNOLOGY KONTAGORA";
const INSTITUTION_ADDRESS = "NASFAT Secondary School, G.R.A phase 2, Kontagora, Niger State";
const INSTITUTION_LOGO = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBAUEBAYFBQUGBgYHCQ4JCQgICRINDQoOFRIWFhUSFBQXGiEcFxgfGRQUHScdHyIjJSUlFhwpLCgkKyEkJST/2wBDAQYGBgkICREJCREkGBQYJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCT/wAARCADXAPADASIAAhEBAxEB/8QAHQAAAgMAAwEBAAAAAAAAAAAAAAcFBggCAwQBCf/EAE8QAAEDBAAEAwUEBAsDCQkAAAECAwQABQYRBxIhMRNBURQiYXGBCBUykSNCUqEWFzNDYnKCkrHB0VWisiQ2U2N1g7Ph8CU0NVRzdKPC8f/EABsBAAIDAQEBAAAAAAAAAAAAAAAFAQMEAgYH/8QAOREAAQMCAwUECAUFAQEAAAAAAQACAwQREiExBUFRYXETgZGhBhUiMrHB4fAUFjNC0SNSYnKS8VP/2gAMAwEAAhEDEQA/ANU0UUUIRRRRQhFFFRGU5JHxe0OT3mlyHSpLUeK1rxJLyjpDaN+ZP5DZ7CgAk2CFL0VBYlbLtDhuy79M9ouk1fivNoUfBjDXutNj9lI6b7qOyanakixshFFFFQhFFFFCEUV1rkNNqQhbiErXvlSToq11OvWoq1ZhY73NdhW24tSn2kFa0oB0kb131rzroMcQSBkFw6VjSGuIBKmaKrzedWd6wyL40645Dju+C5yo94K5gnt9R9K5ZFmtqxVyOi6LebEgEpWhpS0jWu5HbvXYgkLsIab/AMKo1cIbjLhbW/XRT9FRcPJ7RObW4zOa5UMtvrK9o5G1/hUd9t1KAhQBB2D5iuHNLciLK5j2vF2m6KKKK5XSKKKKEIooPUVTLbdLhieQtY9eX1SrdcFq+6bg4drCwOYxnT5qA2UK/WA0eo6y1t9EK50UUVCEUUUUIRRRRQhFFFFCEUVxdcQy2txxQQhAKlKPYAdzXgx2+MZLZYl3itOtR5aPEaDo0oo2eVWvLY0R8CKm2V0KRJCQSSAB5mqbYI4y/IDlsghy3ReZizNkdNdQ5J+a+qUn9gb/AFjXdnMt2e5BxOE8puVeFK8daD7zMNGi8r4FQIbB9V78qtEaOzDjtR47aWmWkBCG0DQSkDQAHoBXQ9kX4/BC7KKKK4QijdcVuJbG1qSkepOqp1tz727JJcCU3Ht8Np0RGhIc1Idf+CPJJHn8vWrI4XvBLRoqJaiOIta865BTL+X2Ri7/AHMq5RhcT0DClaJUR0TvsCfTvUHheYTr5cX27rJtkVa1LaYtzSiX0KbJCirdV7LYKbI9kLEuzyprV4UJMGXGZ51tSOXXISOqdKAIPzqz4pir8C7uXuW1G8adEYLwKP0rcgJ05o+QPn8a3uhhjhLuIy65acNeuXNK21FTJUBu5pNxnpna/HTLdnpkqVOmXi13ZxCo6XYGO3f2hctbu3UtPHonR/V5Vnr8K+4/ejj0i+W5MyS66yZbceCzC2AdlSVl0DZ35D401DYbcuVLlLituOzEIbf5xzJcSn8IKT06br2oaSj8KUp+Q1Q6vYW4Sz7899+GqhuypA/GH8fDTlutrfRJRNjyKy4/cLa/aVramxoz7aYaVOe+2tAVzdOi1J6kfCrnd7i9lMXHym1T4iF3dsutSWdKSlsFW1DyBOqvXKKOWq5K4vIcW5/S3yCui2WIwWNecJAFstxv8yk1eI11uVzuLrUllu3Xi8N2xUdTf6RaWyOqT5J0lVWfiHOuDFytUVi5TLXbXNtrlxACW3yQGw4PJH+NXpyKy8pCnGm1ltXOgqSDyq9R6GoCfgVouF8F4eMkOlaHHGUukNOqR+FSk+ZGhXba1jnNLxYNB3A7rfAam6rfs6RjHCM3LiN5G8k+Z0FlGt53MRcG4kezy7lAZfTBkXJBABe6AlKAOoB7ntVrgXSHckuqiSG3ktOqZWUHelpOiPpVBjxMuxCyTLY0xEfZW4pqFIZ5i4Fur34jnklKQSSfXVQFmgPXScwqBJuEG0W9tbMO6R1p5EqQeZ1x5J7859fh3qx1JHIC5pAA363+vIc8slWyvmicGvBJO4i1uh4czyzzTo3uiqtjGeW+/s+IVBhDstcSH4ivelcqQSoDXTv2q00skidG7C8WKcwzsmbjjNwio3IsfhZNanrbOQS25pSFpOlsuJO0OJPkpJAIPwqSorgGxuFaoDELzKnxHrfdFJ++LYsRpmk8ocOtpdSP2Vp0oeh2PKp+qjl6k4zc4eXpC0sM8sO5hA6KjKV7rh/+ms82/JKl1bkkKAIIIPUEV04fuG9CKKjbffWZ93udqLampNvU3zBR/lG1p2lY+BIUn5oNSVQRZCKKKKhCKKKKEKqcSnZLuN/dEJRRKvT7dtbUD1Qlw/pFfRsOH6VZo8dmFGajsJS2yygNoSOyUgaA/IVULhIN14q2u3JILNntztwdHo66oNN/XlDv51KZyXX7Cu1xZQiyrqtMBpzelJ5/xlPxDYWofKrCMmt70KOwYC+z7pmLrf8A8QX7NAUT1EJokJI9OdfOv4gp9KuNdFvgsWyDHgxWw3HjNpZaQP1UpGgPyFd9cudc3QivPcJ8a2Q3pkt5LLDKSta1dkgV6N6qr5Lf02mV4F5tgcsMhHhrlgc6W1E9Q6nXRPbrXUTC92EffTmqZ5RGwuJt8O/kqvlNyjZTCsd6mRJYszLy3JcNR054SvdQ+UpOyjY/fXkbafzPJZkzHpkFMyCUtJuKGuZtcdY6DR/nUeo7j0rjAsLrWUy7fiN0YcjuJaEiWolx2Cz+INIUdpUlXTQ8uxprRIUeE3yR2GmQTshtASCfXQ86aTTtpwGszyy5A55jy5juSOnpn1Ti6TLPPmRlkR48jlfVddpgrttujw3ZT0tbKAkvvHa3D6mvXoUUUoJublega0NAARRRvpUJeM2x6w7E+6x23AN+ElXOv+6NmpYxzzhYLlcySsjGJ5AHNTdFKW98eY7alN2a2Le9HpKuVP8AdHX94rrs3Hptagi82so6/wArFVsD+yr/AFpj6nrMGPB8L+CVev6HHg7Tvzt4pvUVAWXPMcv2kwbqwXT/ADTh8Nf5K1v6VP7FL3xuYcLxY801imZKMUbgRyXwpCgQRsHpVSuXDu1vreVCSYLMpxCpzLOwmShOzya3pOzrZHfVW6ipjlfGbsNlzNTxzC0guk1jVnvFouLERlplq+zQ880JCdt2yNz+8rlHdaj016AVecfvNytTzltyufGMlyT4UF7SWzLTre+UdtHpXpyjFWbo83eIza/vaEg+zFLxbS4QdhC9d078qpmM4c9l6n7rfXnnlSUFqSmQ0W340htfTwVDolA+FNHyx1DDJIQOOWd+XK33c3SOOCWkkEUIJ4Z5Wyvfnfw6Cya1FedmRGS8IaH0KeQjfhlYK+Xtsjv9a9FJ16EG66ZsNi4Q34cppLseQ2pp1tXZaVDRB+YNVzh/Mebt8rH5q+abYnvYlE93GdAsuf2mynZ/aSqrTVZuMNm05lBvgdQym4NfdkkE6DigStk/MHxE/wBuu2nItUrz35g2jPLHfUuBDE5C7RKB/WJ24wfopK0/95VuqrcTYD03CLk5FOpkFCbhGV5h1hQdTr58mvrU9abizeLXDuUY8zEthD7Z9UqSFD/Gg5tB7kL10UUVwheVu7QHbg7bUTYypzKA45GDgLiEnsSnuAfWvVWTftMLn43xZg3u2yHYUp2C061IZVyqCkqUk9fkB0p4cEeIznEfDETZxb+9IjhjTAgaClAbCwPIKB/MGtctIWRNmBuD5KbLvwpaJeaZ5elqT4aJjFvSsnQSlhhJUN+gU4qorHsthcSOKz6rY8JVnxeIQ2+j8Dst48pUD5hKEqSD8TWfM44gXAYn9xwpKmmb1cp9znKR0LyTIUhCCe/LpBJHn0p0/ZSsabdw+k3NSdOXKatQOu6GwEJ/fzfnWiam7OIyu1OQ+HyQnVRRQaWKFA5bkkGwxWmZSJjzs4lhlmGnmeWddeX01vvVHi5Df27fOt1oS5ewlBb9muDfhzYZV0HiJPR1Hx/Opucs5zfZ1uZbct71hdSqPcErBcS8R19w90EfnXHELbMvGQLyWbeYk5cVC7eExY6meoV73OFddimsQjiiJeM9TfxGnEcwUhndLPMBGfZOQIyy0dqc7HkR3qxYljUbGbUiMyyy285pyQppOkrcI6kDyHoPKponlHXtVDzrMcpsLrrdqxtb0dIBE07cSen7Keo18aTd8zbI76pSLhc5BRvqyg+GgfDlGv31ZS7KmrD2pcBfnc+C4q9t09AOxawkjlYeJ+S0Be8/xywBQmXRgup/mWj4i/yHb61Qb1x6HVuzWrf/AFspWv8AdT/rSfo1T6n9H6ePOS7j4BeaqvSerlyjs0csz4lWK9cQsmv3MmXdHktH+aYPho/Id/rVd2SSfM18opxFDHEMMbQBySGaeSZ2KRxJ5ooooq1VIqfsmdZFYCkQbo+G0/zLp8RH5Ht9KgKKrkhZIMLwCOasimkidijcQeSbtm49upKUXm0pUnsXYqtH+6r/AFq/WPiNjV/5Uxrm028rsy/+jXv69D9DWZK+0nqNgU0mbLtPL6p9S+k1XFlJZw56+IWvgQsbB2PUVUOJFvmvWOVMi3mfBTHZJ8CMno8rY0CQOb4dD50irLmN/sCk/d10kNI2NNFXOg/DlOxTXwXPchy7mhTbCJEYksvzWV+EG9jrsHz16HdJJtkzUbhMCCB0HxXoINuQV7TAWlrj1PmM148bmWLBXDMnoS7kU/lbFvh7dWwk60gkn8ROiSTvfypsoVzJB0R8D5UlLpaGLVlam0SBa0RdoiQrYyZExxJ7uE691Sv2lHYFX/Ab21MZmWcQZsF22LSktzHfEdUlY5gpR9T16VRXw4miZpJ49N3hlpfmVo2VUFjzTuAAvYdRrfmcznbkFbarXEi2SLrhF3ZhKKJrTBkxVjul5ohxBH9pIqy18UAQQoAg9CD50qa7CQU/VO4eZ/ZuKOKIkxnWi+tkNzoe/eYWoaUCO/Keuj2Irq4LylPcO7bEdJ8a2qetzgPcFlxTYH5JFZJmXS7cJeJ90cs8hTD9unOthOvdda59hCh5pKdf4itQcErq3POXstJKG03tyU2k/qofbQ4B+ZNMaql7Jhc33TYj771KZMmSxDYckSXm2GWxzLccUEpSPUk9BXGHMj3CM1KiPtSI7yQtt1pQUlaT2II6EVjLjhxZuedZDNtseUtuwQnlNMR2zpLxSdFxf7RJB0D0A151rTh/bfufBrBbykIVHt7CFAeSuQb/AH7qiekMMbXOOZ3KEovtaYq7Px+15JHZKzbnVMSCkdUtOa0T8AoAf2qr/wBlC4LiwczTs8jTDMgDfmEuf6CqNfc1y7htlt/xldxcuNsRJdZdgXEl9h9lR2OhO07SR1SRTa4D2nGP4IZPf8dkS21zY5ZlW6QoL9iWlCyAlXdSTzbBPXQ9QaYSNMVJ2bswbWPfdSlZM4cXLI8Uw+++IxBsgtrqp9zfUA3G1KdJ2PxKUQsaAGyelW/FeKSL9m2H4JiZlWzFYL6E7J5ZE0oCl7WR2SVDZT57O/SoDOL0+19nXALa25pqW68p3Xn4S1aH5q/cKgPs+QXJ3FywhHZhTr6z6JS0r/MiryzHE58m7Fbzz6oW3a6pclEOK7Jd5vDaQVq5UlR0BvoB3rtFQmaXVFmxuXMclSIgTypD0dCVrQSoAEBXQ9/OvPxsL3Bo3qqaQRsc87gqvNm4JlE8Sxe1Wy4lPIp1t5UR1Q9FcwG/rVvxzH7fjltTDtwUWVKLpWtfOpxR7qJ891QY+OzH7w/c03vG8hVNQ206ia2kHkHbQSSAaaDaEttpQhISlIAAA0AK21hDQI2OJH3yBy6Jbs9pe50sjAHcQNfMjPquRG6iLxiNivwP3ja4r6j/ADhRpf8AeHWpevi3ENjmWtKRvWyddaxMe5hu02KZyRskGF4uOaWlw4EWOQ8Fw58yIjfvNnTg+hPUfXdLrJLzarM89acYgiOloqafnPe++8QdHlJ/An5aJrSNZMvQP3xPHX/3l3/jNeo2JLJVPcJ3Fwbaw/nj3rxnpFBFRsaadgaXXuR8uHcvFX2mBh/B+639Lcu5FVthKHMOZO3XB8E+XzP5U2bFw4xmwoT4FsZfdT/PSR4iyfr0H0ApjV7cp4Dhb7R5fylVD6O1VSA93st56+CzfHtk6WAY0KU+D2LbSlA/kK+yLTcIg3IgS2R6uMqT/iK1mhtDaQlCQlI7ADQFfVJSoEKAIPkaV/mV9/08uv0Tn8oMt+rn0+qyDXytO3vh9jV+SoSrUwhw/wA8wnw1j6jv9aVOX8GrlZkLl2Za7jFSNqbKdPIHyH4vp1+FM6TbtPMcLvZPPTxSit9HKqnBez2hy18EuUpKlBI7k6p02PgTAQ227eLi9IWQCWo45Ej4bOyf3UmmQRIQCCCFgEEduta5b/k0/IVm29WTQhjYnWvf5LV6M0EFSZHTNvhtbzUNZ8Lx+w6NvtUZpY/nCnmX/eOzULw3A8bJwBr/ANsv/wCAq5pWle+VQVynR0d6PpVN4b/y+T/9sv8A+ArzTXufFI5xucvivXPiZHPE1gAHtadF7b7hz8+9IvdqvDtpneD7O6tDSXEuo3sbB8x619s9vtOHykRXp7r9zu7hUp+QduSVpHwGgAOwr05o+zFsTkiTdplqYbWkrkRE7c0Trl7HuSKXHteKffFtlsT8ldlxJrXNIltrcG1dAhXMQEb+XYVfBHJPHYk2GWQ4aXPC/VZqqWKmmu0DEc83cdSBxtfPJOQUqvtF3+64niFuv1luD8ObEuTYTyH3HEqSsFK09lJ+BpqjtSn+09b1zuFEp1Gz7JKYfVr05uX/APesdLYzNB0unSRuVMt8dpab7jUdDWUCOlNys6lBJkco14zCidKGtApOiAB3pw8MWpGP5JxFtywEPRYdvcOjvSxE0f3prM2A3t/HM2sd0jKKVsTGt6OuZKlBKh8ikkVqnEGm5/F/icwXdNOMQmVqB/CSyQfqKbVrTG3s/wBoGXiFJWWOH2MP5tmVpsraVK9qfSp5WvwtA8y1H6A/Uit/oSlCUoSNJA0B6CsRSsyi8Np1wtPDyQsrJLD9+fQlUh8A9UsjXK23sd+pVre+1aC+zMzc38BfvF2mzJki5znHUrkuqWShICNgk+qVVXtNrntEhyG4b0FUL7VuALZmRM1hMktOpTFnco/Aofyaz8x7v0TVN+zlkLtuzd+xlQ9mvsN2MtJPTxEoUpB+fRQ/tVaeIvFXLsBym94ffmIeSWOTtbTc9vlWuO51AC0a7dU70dctU/hJjSb9xBtNzxWU00uDNakvW6a9yvNshQ5yhWtOpCSR5K+HnV8eIUpZJpbI/BC45Qlb/AfDnebYg3SdFX/RKiVAfurw4FlyeGFtuF7joS5kdwZ9lgNuJ2IjJ0VPq+KugSPPRJ6d3hwVs9rkw80xe926LPYsd/dkNMSWgsI3vlUAf6p/OswZBeJGQXyfdZR27LfW6QBoJBPRIHkANAD0FWwESl0RGQN+t80Lb3Bu+zck4Z2K6XKSuVMeZUHnl65lqStSdnXyr08THLe3ib5uTD8hnxWglppYQVr5hygk9hvvUB9nMqPB+xc2+njgfLxl1aM/lW+DisyXc7ei4R2eVXs6+ylcwCd+g2e9JmjDVWA/du67llrR/QfnbI66aKlW+ZaZV/atjuD2pi5NONuKdZfa8NtBI0oKGtqH7I86aw7UnlxBjTtqucmz4m+iVIaSiNCQrx2yo9FIUSeYj5U4R2q3aAF2lunXfv1J++Kw7JcbPa/XoBkdNAPvgiqHxwxyZlHDS7wreFqltJRKZQj8S1NqC+UfEgHXxq+UVgY8scHDcm6zTwj+0wI7TFkzlxRSjSGrrokgdgHgP+IfUedM/BuHNsRMeySVJh3VUl5b0RTCudlKSokKB7KV1+lI/ifjeDZTll3bsdyZxnIY0pxqRb7kPBjTFg/jbcG0oKu+joHflVJtOS53whuQaiypNu5/f9nWQ7GkD9oDZQof0kn60+7LG0/hzgLtR/H0VE1JFM9r5Bct0W7aKz3h/wBrW3yfDj5XZ3IS+gMqEfEb36lB94fQqpv45xKw/LChFmyG3ynl9mPECHT/AGFaV+6k0tLLF77VepLIcms+J21VyvlwYgREkJ8V06BUewA7k/AV58XzXHc0jOScfu0a4NtEBzwiQpBPbmSdEfUUiPteQLq4vH5yUOrtDSXW1qSNpbeURrm9NpHT5Gq59lO3Xd3PJVwjIdTbGYa25bmvcUokciN9irY38ADWptE003b4s1K1rQe1V/JOIOK4jzJvl+gQnUp5vBW6C6R8EDaj+VKLMPtZWaClTGK2x65va0JEoFlkH+r+JX7qyxU0svuNUK9cROGlvvCVXmI/GtktohbzryuRlaR3Kz5Eev50uOK/2mY8Zh2y4M8H3ynkduuvcb8j4QP4j/SPQeW6T9+zfPOLlx9lkSpMwEcwhRv0cdtI8yN6AH7Sj9as2C4thGJXy2u5Xc2Miu70htqPZbTqQ0halABTzn4VaJ3yg+XnTkQlrGioOIt0H3/4qIqSKJ7pIxYu17k+Ps9WK42ThvHeuynjMuj7lwX4xJXpzXKVb8yAFfWpjhudPZP/ANsv/wCAq2TEvewvpjKSh7w1BsnsFa6fTdKXga9cXbrei9JLjOgp4KVvmeKj735BXX5VhjaZoZpSbaZd6xVc+CrgZbXF8EwOIX3cMPuJuofMNKUlYYICyeYaAJ7ddVTJ0gxGk3LIcUQxbrjIjrdeZnlbiVpGm1KSNfXVXrM1sJx2UiRLgRW3dNlycjmZ6nsobHeqHZ71ccjlG1KiYtcItqkNJaPiKbCtdlNDZB0K7oweyJtkDnmRllpoL367ll2iR24F8yBbIHPPXU2tfhvTXHUVmbiZxYkW3iTk+IX11crFZzLcN1vk2uGVNJPit+pCjzEeeq0yO1Yc48Eni7kmz/Po/wDCRVezImySEO4fMJ+Aq/j9kcVnFotIWl3xbgw226gHldQXAAtPwI606bvlDthTxovMdzw3pE9i1sLSeoUQpBIPqE7NSP2XPu+949OF3gxZTuPy0vwpLzYU5GStJJCVHqACknQ9TVQON3XNOE90vbD8CFEnZLJuc2TMe8NCGkoKUnsSr3lKGgCSdarfLIHylr91h1zv8kJU4xjk7LL9BsdtbK5Ux0Np9EDzUfgBsn5Vv3HLHFxqxQLNCTqPCYQwjprfKNbPxJ6/WsX4dxNjcM25C8Zs8eZdnkltd2n7PKj0baGuUfMknz12rVPBuXkl0waLd8qmGTPuS1S0J5EoDLKtciQABoaG/wC1VG1cbrE5NHmgpefaww03DHoGVRmtu21fs8kgdfBWfdJ+S9f3zWa8ayCZil/gXyAopkwXkup/pAd0n4EbB+dfoDe7PDyGzzLTcGg7EmNKZdSfMEa6fHzHxrCvEfh7dOG+RPWm4IWthRKokrl9yQ35EfEdiPI/SrdlztewwO+wgJ+4RfI4483QMK5bfmFnYuDA33V4YP59HazNfLa9ZbzcLbISUuw5DjCwfVKiP8qYGLZG7a7Ph+V9SrGLuq3yCO/sr36RI+X8uPyq+cbuD0aFKyXiM7cEKguttvR4bSTzKkL5UcylduXZ5unftVkThBLhdvFu8G3wshcbPxaGANcPcKgvJQ2z4Ll6c6KCfGJPhfAp5+ZXmNAetaQujRft0hoRmpRU2oBh06Q4dfhO/I1+dKnFqWXColwnm5ieu/Wv0Dwi9IyfDbNdwrm9shtOK3+0Ujm/fuse0qcRYXt5366qHtuLJSKuItOQiLBRi9jeb/l5TKS+Y3qlKlfiV8EinfbJjU+BHksOl5t1tKkuFJSVjXfR7VTsngY5iMBr2J6BY5TjqVodTGDrjiQdqGtFRBHnU9jOUR8mbffjNFuOlwpjrWdGQgdCsJ7hPNsdfSua1/bRtka02G8/fzKSbOj/AA8roXuFznYffjkL3U5QSACTRUXlMswccukpJ0pqK6oEevKaWNbiIaN6cSPDGlx3JLcY+HGL8Q7LJzy13di1yYwLcmRISoMPhB5ffABKVdgFAHprY86y/IaVHeXHLrbgbUUhTS+ZB+KT5ite8C0KuFuvdulobkW9XJzMuJ5kqKgoKBB7ggCqNxt4M4biMZF5gW7Io8d5SvF+7UIfYjfFSVkFIPXWjrp5dK9EyUUs7qVxJA0WXZlWaqmZM4WJ/wDFneubD7sV9uQw4tp5pQW24g6UhQOwQfI16JyLYjrAky3hvu+ylvp9Fqq3Y/wRz7JYSJ0KwONRnBtDktxDAWPUBZBP5UwdIxou82HNMLpgXb7REHL+FN0xy/xH0X16KGUPNoCmZCwoELP7B6bPTW+1dmBcfLDw74UwrPDhvTb82Xiprk5GkqU4ohS1+Y0U9B18ulJ3KsLyHCZqYeQWt+A6sEtleihwDuUqGwfoa6saxS+ZhcPu+w2yRPka2pLQ6IHqpR6JHzNZPwlOY/8AG99clGS817vM7IrvLu9zfL82Y4XXnCNbJ9B5AdgPICvFV9vPAriFY4q5cjHnH2UDazDdQ+Ueu0pJP7qpkFFvK1C4yJbCR28BlLh+IIUpOq1MkY5vsG4HBTddMdtT7qWEuIR4qgglxYQjv+sT0A+daT4LcMcaw+zo4i3m7RbqpoH2dUUKUzHO+QkbAK176b1oeW+9QnBbg7hudNO3GXEyd+IwpJQ7MS3HjyDvqlPISpWvPrrrTO40x27LilptdtabiW4PcngMoCUAJTtI0PrWCWYVEzaVpIuc+ixbRqjTU75gLkBMDIXJsnGpi7Ojx5T0c+zgKA5iodDs/A7pa8KcUynGcjWudbXGIT7KkOrUtJAI6p7H16fWmDgEtU7DLO+o7UYyUE/FPu/5VYCKVNqX07JKYAEHI9yyuo2VT4qsuILRcAaZqncSrvHtlpaD0qbHUtfMkxoiXwrQ7LCvdA6jvqqlgPj5FdGJEiz406w0vxEyEJbalJ11CuRBOjvXfVSmT3GR/Ctxu6ZDOs1nUwn2KRE14Tjn64WrRGwfI17uG78e7LnylxoUmRCfVGaurMcNmU2RvfQd+261tHZUhyzO/r3DvzPRYHnt64XNgDa2Wdu892QvxUNx84mzuG9tsbtrWn2qTOCnG1AEOsIG1pO+2+ZI3Wc+N0qHes2OS2xfiW++xWZjKvNJCQhaFeikqQQRVp+1bfDcOIES1pWSi2wkgjyC3CVH/dCKovDHDWeIWRHGnZrkR96M65Dd1zIQ6nStKT+yUg7117VoooWxRNmPA36L0oTH4RzV4fwNzrJFe4qWv2SOT+svk5AR8i7+6qzxCvq7Nw0wzBIyykexpu04ftLdJU2k/IEn6pq9cSMZVjeGYJwkYfbcmXCaHpjjQPKoBR5l9eutrJ+SKSGZXlOR5XcbgwFeA8+W4yPNLKfcbSB8EpSNV1TtErzJuvfwyHzQu7h/ijmbZlarAjYRKeHiqA/C0n3ln+6DW/Y7DcVhthlAQ02kIQkdkpA0B+VJX7OHCaRh9udyW9x/CutwbCGWFj3ozPfr6KUdEjyAHxp20s2lUiWXC3QKCkp9o7HMhj29nNcYu1zhv25HhzGYshaApnew4Eg62kk7+B+FIBXGPLZ0UQb9Ji5FA3sxrrHS6PmFgBaT8QrdbnkMNSmHGH20uNOpKFoUNhSSNEH4arD/ABo4bOcN8vdjMNK+6Jm34C+4CPNsn1Seny0fOtWzZWPHZPGY0QEx8Kw/DM+4X5U1iTUyHeZDDa37ZIkeKll5olaC2SNlKuqeY9epFe1GQP599lu5MqKnp9mQhiQD1VytOIUFH/u9fkaSnDfOJXDzLoV9j862kK8OUyk/yzJ/En5+Y+IFOXHJduwrjLMtA8N7Ec7jhyMR/JKDoJTr+0Vo1/SFWzxOY477HEO7UeCFnOtk8Ackt8XhridpmzW2505MoRGVH3nUturKtfIEVlXMsPnYlmE/GnGluPsSPDYCQSXkKP6Mj12CPrU9kuRTsPyjH4EF1BdxBptkFJ91UjmLj4+XOpSPkmtFXEKljWtPPy+oUlar4gWnwbhEyMXn7pbYZVEfeDPiq5FqGuUdgdk9T2qq2uVCxi/x4WOQZC5keWY85tYDrkmOQCHQ4OiEg9ddBTDst1tPEfDmJ7KQ7b7pH95snqjfRST6KSdj5iqRNfxyzvzsWlWudEYjuIWyxDC1LuoKey1AbI35brBSSlzDE4EkbuXPebXPxuLLzu0afs5e2aQ251N735bhewz7rG6aqFBaQUqCgRsEHvULm7ZdxG8oSNkw3f8AhNVnhxe2LTAbsUpxwuNKUXHCsFqIpavcjlZPVej2G6vc2KidDfjOfgebU2r5Ea/zrA+MwSgHcfFM45RVU5I1I04GyVH2f3U+Hemt+/zMq18NKpuqQlaSlaQpJGiCNgikVwemKsOcS7RJ9xT6FxyD/wBIg7H+Cqew61t2021W5242PksHo7Jiomt3tJB8fqk7xndwrhla2shaxGyv3990twSqMkAOa2XFADqEjr67IpDvYtxY4px/4SuQ7rdo76iW3C8lCCAdfo0FQ0nfToNdK0T9oDhlP4jYvGNoUlVytjqnmWVK0H0qGlIB8ldARv0150pOGvHa58KoqMQzCxTTGiKKWiE+HIjpJ3ylKtBadk66j613SPPY4ohifvvw5J6p2Hw5yNrgNkcPO0uh6CFTbW286l1yKG0b6KBOgo7HLvsa67LgN+l/Z4towbnbud0e9quPhuBp2S3taeQLJGgNJ6bG+vqd2nMOO+AZVw9v8OHeVMzJMB5puNIYWhxSykgAdNHqfI13cOeI+NYHwUxmZep5QgtKZCWG1Oq8TnUeUhIOjr11VZfMGXLc8WluSEiWcG4tcPGHcjYg3a1txPfdebkJUAkHqVICjzJ9dgjVO3grPxDixEk3i64nZf4SwlJRMd9lSQ9sEpdAI0CdHfxHyqkcSftES8+gP4rhtlmpbnjwXHlo533UHoUobTvl323snXpTF+zrwtufD+yzp97T4NxuhRuKCD4Dad8oUR+sSok+nQVbVPcYS6UBr91tbc0JutNNstpbaQltCRpKUjQA+ApYce3UpsVta6cy5RUPog/600aSPHO5e3X+32hg8647ZUUj9twjQ/ID86o2Owuq2Hhc+SS+kEgZQvHGw80xuGLam8Es4V0JZKvoVE16svySJj9u0/IeaflczMfwGi64Vkdwkd9d69llhCy2CHDIOokZCFa69Up60tbtk9wyS3wr69bk22HGlc8O5NOh1UZW+X9M335T2PpXEUXbzukPu3+N7fdiupp/wtK2Ie9hG47rX6d5C9eL41GkWdK8Wv7onNDU2PMbKmnnO58RlXVBPqP31eJV4g4pYG519eiW9pvw0OqbBDaXFEJASO+io1B47YsgcyxeQXj7tYBiezckFSiJHXYWrf7qSX2quIDdyukTDoDpKLeoSZiknp4xHuI+aQST8VD0qx7DUziPFcak8OV96t2bAGsvhw7vrY3tdLzjs+uRxbyRSzvlkJQPkG0AVO/ZggOy+K0eQge5DhvurPoCAgfvVVW4hqfvhtWYK2tF4ioRIcHYS2QG3Un4kJQv5Lq/Yar+Krgrdsuc01esmPsVt3+JDXUFY/3lfRNM5TamEY1Ps9+hTRW3GAjihxryjJ5b/LYbFEdt7L3NpKQUqRzJV5dPFXvy2KU9wzbHcMuykcOrQzuOSlF6uY9pkOEfrtoUORseh5d/KpvKbseHHCa14NDWtq8X1AuV3O9KbaX+Bo+hICdj0B/apRJSVKCUgqUToADZJ9KimgDruPu6AchvKAEz8RvvEfi9lUawqyq8eE6fElONPFtDDI/ErSND4D4kVsuFERAhsRGlLU2w2ltJcUVKIA0Nk9SenelvwF4Yjh9iaX5rQF5uYS9K33aTr3WvoD1+JNM6k1dM2STCwWaFyUVVeJHD62cSMbds9w/ROA+JGkpG1R3QOih6jyI8xVqpK8WuMGdcMbmsKxq1ybRIXqFO53CO34HAOy+/oCO1UU7HueBHqhZszfh5kXD64qh3yCttG/0UpAKmXh6pV2+h6irNYSvNuF022N+Iq9Ygr7yt7jZ99URSh4qB/UVpY9KlZ/2os1uJKHoGPqiq3zRnIinELHoeZXWmPwU4n4FkF0MV3GrTjeRykFnmjtJSzMSTsoSfInQ9099dCaezSTtixSMzHArrNT/CtzHOKlvteeTbezIyq0smE84o9nUjYXy9iSDsHXTmOu1ZCuL70q4y35JJfdeWtwnvzlRJ/fun0p1/7OXF9ZIcTiF8PMdAlKEb8v6Taj/dPxqgccsLOJZxJkxUhdovBM+C8jqhSV9VJB+BP5EVFHZkpt7rhcfx3ICYX2T879mnzcMlufo5O5kLfk4B+kT9QAr+ya0Bdm42SRptsh3VTD8daW5Xsq0+M2CArkP7JUkjr8axBwxuL1q4i43LY2VpuLKNDuUrUEKH5KNXwcXZeE8csivTalP2yVPXGmMD+caQrkCk/wBJPLsfUedVVVG505fHra/euJIw8Fp0KZ1xj3KJklhhNWrk8IqkQ7K2dhrXRC3leaiocyj5Aa86cVkYuEa2Mt3SWiVM0S66hHKnZO9Aeg7fSuq0OWi9Ns5DbfZ5AmsJKJaANrb7gb+vapQUvqqvtg1uG1vv73nel9FQfh3Odivf7+XQbkieKtpk4pmcfIYI5EyVh9Ch2S8nXMD8+h+ppyY5fI2SWaNc4p9x5OynzQrzSfka6MuxmNllkftsj3Sv3mnNdW1jsr/X4E0lsSya5cMMiftd1ac9kUvUhoDevRxHr0/MUwa38fShrf1I/Mff3mlL3+q6wvd+lJ5O+/vJaCpe8crvY8dwOXc7zY4N5VzJYjMSmwpJdX269wAASddelXq33GJdIbcyE+2/HdHMhxB2CKovHbC5udcPJcC2N+LOjOIlsNebpRvaR8SknXx1SiAAStD8s816Zrg4XGiReNcI42ZcOr3mNxs7di8GI5It3sLy+WRyJUVKU24VaSSkAaI31+FRDHCfLcf4fRM+sVzQ/FlRRImREI95DR3vmSdpdSB3BH0phcLeKEK6cK7zhNxQ5Fu9ptExCUrQQlxpLau5/VUneiD6V4J/Gex2PgbasWtb4n3yZa0w3Gm0kiNzJ5VFZ/a6kBI2d047SoxloH7tNcl0mT9n292HJMKE+12G3Weay6Y81uI0EhTgAIUD30QQdHt1FNGlZ9nTBZ+E4GfvVksTbk+ZamVfiaRyhKEn0Ohsjy3qmbLlx4UdyRJeQyy2nmW4s6SkfE0oqQ0zODMxdckgZldN4usayW2RcJi+RiOgrUfX4D4ntSPwKDIz3iC7eZySWmHfa3N9QDv9Gj9w+ia+Z3mMziHeWbJZW3Fwg5ysoA0X1/tn0A8t9u9NzB8SYw6yNwWylx9f6SQ8B+Nf+g7CmwZ6vpiXfqPFrcAvMl/rSraGfpRm5PE/f3mjMoNyXATcLPLdZnwOZ9toHbcga6oWnz2O3oaqcKLIzq0ri/d7lhauQTKlSogQ4xMToAp2eqVdumvI7pmmkLx74nw8Dsq8JxgoZuMtKjJU2T/yRpeydHyWrZ16Dr6VhpJHOtGwe1fI8PvmnE1F2suIn2SMxx/jLI2smfkOZ2jEsBlZHHlMyoUOORHW24FpeWPcQkEd9q0PzrCNwuEm6z5E+a6p6VJcU864rupSjsmmTecidf8As749aUKIQ3en2XAPRKS4kf8A5AfpSvAKiAkEknQAGyTTfZ9P2QcTrc+SYtAGi0J9m7F7bneFZLYMhiCXbEzWXmkklKm3Sg7UlQ6g6Ce3r8a8V6uFu4jcUvAKQjCMIjLcUhH4C0yOuvXnUlKR6pTXqul2c4J8HYeKxtoyzIwX5CE9Vx0Oe7vp+tygIA9dnyq7YPi+NcGuE772apjpcuiAu4NOpC1Okj3WAnurQ8vUqPasUj7OdKN5s0eRIULL+SX24ZvlM27PNremXB4rSy2CogdkoSB10AAB8qffAbgFLgz2cqy+GGVs+/Ct7o2pK/JxweWvJPffU9qpcr7QSrNPUrB8Px6xRUnSFqiBT6x/SUkgDfoN/Opmy/aqzeZKYgjHbTcZL6g222wh1K3FHsAAo1qnFQ+PBG3COualapoqKxaRfJdjjP5HEiQrm4Cp2PFWVoa69E7Pc61vy3UrXnSLGy5RUfkFgtuT2iTabtFRKhyU8jja/wBxB8iO4I7VIUUAkG4QsP8AFvhDdOGN1KgHJdkfWRFm67f9W5rssfke49Av0qUhaVoUpKkkKSpJ0QR2INfopeLPb7/bX7ZdIjUuHITyOsup2lQ/9edZm4jfZaulvfdnYUv7whqJPsDywl5r4JUeix89H50/o9pNcMExsePFdArvxHLYPHTC14DlUlDeTRwXLXPcH8upKemz+1rYUP1h171F4XJZyG1yuDOfoMC4RXVC0THj70V/ya35pO/d8iDr9ml2eHOf2WY08nF7/HksrC23GoqyUqB2CFJBFO7KOG194ucP4OVybM7Z84hoKFtrT4Sp6EHoSO6VHuknsenbWiURxmwd7JPgePTihLXhVw/urPGuBYrnFWzIs8gy5Se4CW/eSQfNKlcmj57pcXJ1ci4y3nTtxx9xaj8Sok1qTgZxkYvkr+DmWpai5QyBFalvN8jkxKd/o1nWw4COx7/PdI3jRgz+CZ7cIhbUIMtxUuG4R0U2s7KQfVJJT9B61dTzudOWSCxsLc+iAVbfs78XlYfdkYzeHibLPdAaWo9IjyugP9RR0D6Hr61rqvze+XStu8Bs1dzbh1Cky3VOToSjCkrV3WpGuVR+aSk/PdYtq0wae2bv1QQmJVZzbBLdmcMJf0xMbGmZKU7Un4H1T8Ks1FKopXxOD2GxComgZMwxyC4Kzw09l3CW5KQpBEVauoUCqO/8QfI/kabGGcRYWWW6ZJMZ2I5BQFyEE8ydaJ2k+fY+VWmXDjzo648lhp9lY0ptxIUlXzBqJtWF2OyJnIt8IMInJ5XkBSiCNEaAJ6dz2pjU10NTHeRlpOI39Upo9mz0cwEUl4uB1HRZgdtGU8fJWRZXFMSyWSI25pKEcvtHIkrCFcui4rWiVK6DY16VxTjkzhNYcR4jWq0QrnEkRmnprkwFxbbrg3pKeyBrolQ6771b7Zcp3AW35Bh+R26SvHpwkOWu7sNlaVLWjQbXrsTofI77g7HCZIvnE3BcV4cY5apKYZgQ3Lnd32ymO2lKAeVCuyjsddddjXqRo7V17D9Pytb4/NPE48k4jQcfxy33oRnpCbihK47YIT+JAUOY+XQ0p5l2y7itPERho+yoVsNN7Sw18Vq8z8/oKc0vB7JcbVbbXNjKkRrYhCGEqWR0SkJG9Hr0FTMKBEt0dMaHGZjso/C20gJSPoKzUtbDTMxMZeTidB0SSt2dPVylr5LRcBqeqrOC8PLfh0bxPdk3FwfpZJT2/op9B+81baKKXzTPlcXyG5KaU9PHAwRxCwCofGHidG4Z4uuYnkdukrbUFhX6y9dVkfsp7n6DzrEVwuEu7T5E+c+uRKkuF111Z2paidkmrzx0zd3NuIU9xKyYNuWqFETvpyoOlK/tK2flr0pfV6PZ9KIY7nU6rQAmJj9ik37gnkr7SSsWa6sTUgdSEqbKHP3FJ/s1McLMbtWIWVfE7MWtw4yuWzwVD3p0gdlAHukEdD26E+VNzhdb7Twc4PKumWlEc3EmVJYdQFLXzp0hkJ/WVygdPid+dLjHrRfftIZumfcmlW/FLYfDQyyOVtpsa0yjyK1DXMR2Hp0FZ+3x4xoy+vyHVQu/h7G++rtceNPEZ0N22K4Vw219Q+8OiEtpPdKOyR5q+Rpa8TeJN04mZCu5TiWYrW0Q4YVtLCP81HzP+Qq98bbfm19yMY9bsSu0fHLN/wAnt0aJFWtlaQNeLtI0SR29B8d1Wsb4BcQciltsqsT1rYJHPJn/AKJKB68v4j8gKuhMQ/rSEA7hwClUKFBlXOYzChR3ZMl9QQ0y0kqWtR7AAVr/AIIcEY3D6Gi8XdCJGQyG/ePdMNJ7oR/S9VfQdO8vwt4KWDho0mU2Pb70tHK7PdTojfdLaf1E/vPmaYlLq7aBl9iP3fioJRRRRStQiiiihC6J/tfsMj2AsiX4avB8ffh8+vd5tddb1vVZaz3jjxexW5OWi7RrfZn+vI4zF5kup/abUskKH/o1qyoLMcKsmd2Zy03yGmQwrZQsdHGVftIV5H/0a000zI3f1G3CFiWZxVzufJMl/Lrz4h/6OSptI+SU6A/Kr/w/+07ktgkNxsnKr7bj0LhATJb+IV0C/kevxqB4pcC7/wAOnXJjCXLpY97TMbR7zI9HUj8P9bt8u1LSvRCKnqGZAELrVai4kcNrLxhtIzzh/NbXd0pSpaGlcntBT15VDuh4dNE99DfkaqlszeDxUsq8A4lLFtyCKsot12fRyFt4DXK6Omiex7BXwOjSw4fcRb3w4vKbjaHyWlkCREWT4UhPooevoe4rQV6w7DvtH47/AAksLybbkDaOR7euYLA6NvpHceix1169qwyRmCzZD7O528fRQs1ZRjF1w69yLNeYxYlsH+y4nyWg+aT5GtF/ZALn8H8iBJ8L2xrlHlzeH1/ypY3S4z7OW8H4sWuU4xGHLCuaPelQk+Sm19nmvVJ+mj0rRHAfGLLi+EBmy32PfGpUhclyWynlBJAASU7JSQEjoeu91NfPenwu1NsxoVJKY9FFFIVyiiiihCVGTouWbcRLxjz8tTFhsdp8dyIntOefQsJLnqhIB6eoBqGwazSeF+Q4Zb7VMkv2TKIREqG6srSxLQyHC63v8IV12P8AypxfckEXhd4SwkTnI4iuOgn32wrmCSOx0Sdemz60O2O3P3OHc3IyFS4Ta2o69nTSV65tDsNhIG/TpWkT2GC2Vvl/OaF7qKKKzIRXxe+RXL310r7Qe1CF+cs8r9ulFw7X4y+Y/HmO6a/DbELNhVrb4iZ+gIjI9+0WpY/TTnR2XyH9UeW+nmemt92c27AeHOY3K5Ny28ruTklciLa0gCLDUpXN+nWCfEIJ6IGvjU9hXB7JeK91OYcSJUmPAWAtqOo+G48juAlP802B8Nn99elmqA6MEnC3zPIfypUfabLl32l8qF2vC3bbjERZCOT8DY822t/jcPmvy/IVeM3424zwktbeI4PDjTJkNPhEJO2Ix8ytQ6rXvqQD37nyqo8XOOkaLC/gVw8KIVsjJ9ndmxvdCkjoW2vRPqvufL1KDriKlM1nSCzRo3+VNlcbzxhz6+ylSJOU3Nok7DcV0sNp+SUaH51JWPj9xGsYCG8gcmo6AImtpe/eRzfvql2KwXTJrm1bLPBfmzHT7rTSdnXqT2A+J6CtU8JPs6W3DlsXrIy1c70kBSGtbYiq+G/xqH7R7eQ86sqn00LbOaDysg2Vl4Q5BxBye2qumY263W+I6gGIhttaH3DvqpSSSEpI7edMSiivOPcHOLgLLlFFFFcIRRvVFeS7zk2u1y56klYjMrdKfXlBOv3VIBJsFDnBoLjuXr3RWcLXLyTiLkhjG8vMvupW4n9IpLaABvlAT2FFlxzJ7w7dmzcJcX7qQtUguvL/ABJ37g69zo08dsUMuJJQCACcuK8030iMljFCSCSAbjdmfJaNcQl1CkLSFIUCFJI2CPQ0meIH2YsdyZ52fj733DOX7xbQjmjLP9Tun+ydfCqSi25e5avvZLd3MHl5vHDi9cvr33r49qmP4EZp7Ta2PaZY+8UhSV+M5ys9N6X6ED51azZfYHE2oA+nehnpDI/3ad27z03JZXr7OHEa0PqQzaGbm0D0dhyEEK+iilQ/KrXwe4NcTscy6DevCbscVtYEkSHkqL7X6yORBO9+W9aPWpH7izNd1lWthF1fkxT+kCHV6A8jsnse49a8bzGUR48qS8bq0zEcDL61uLHhrPYHr8R+YreaWSRuDtW58uPeuHekzmjOB2/y13blojLMNseb2pdsvtvblsHqgnotpX7SFDqk/Ks63/hDnvBi5LyDAbjKuFvT7zqG07dCR5ONdnE/EDfwFTdnx643Kwt3qTlZt8dx5TCQ846olQ/q11SrDfWcdkX+Le35cKPJVHUW3nAdA68TqfwkkfnWKCg7Jxj7UEXsQQbX4K38wSYcfYG1r+8NONtVMYF9qazXPw4OYxvueYPdMlsFUdR+I/Ej67Hxp2227QLzFTLts2NNjr/C7HcC0n6g1nhnhVNnuWZyWqI2/ey4pPjNlS0cqebaz5kj/GvqsCuNqjIfx26RZrL0oRF/d61NlLx7BQ6fnXE2zKVzv6ctj324a9xXR25LbF+HPiOAOmuhC0hRWfpeG3ppqYiHlbU+fBQXJMFiQ54iAO+iTokVwi4fkM27WuBHvrzjdyie2NyA65yIRrqCN9x0H1rP6qjtfth4Hr8PFB25NfD2B8Rxt8fDetCUVnRnGsgW3KW/epEfwLii2gLdcPiOKUBsdewB3XfdcYnWuWIRzJL8wyG45joW8FBSlAb2enTe6n1THe3bDwKgbekw4uwNv9h97loSis+3jD71bY9wcjZSie7bdGXHafcS40D56Peu44Bk7s25wI97dkPwY7b5QHXB4wWCQlOz36edR6ritfth4Hl/IXXrua+H8Ob9Rz/gpi5txlwzA0qRcrq2/NAOoUTTrxPoQOif7RFIy68UeJXG+a7ZMPtr1ttizyuKYJB5D0/Sv9gPgnW/jXuj8MZM1uzLYYhreu5dIQpvlLPhnSiskV2XWyjGbcDa8rhym0O+GuNCdU2Uq8yE9iPjW+HZtOw2Y8OfzBtw+I3qt3pC9rS90BAHMcL/AAKvXC77OtiwZbVzu6kXi8JAUlS0foI6v6CT3P8ASPX0Aqe404tl2YYmbVic+PFU4s+1tuLKFSGtfgSsA669x5jz9VparDOnY+ze5mXC2xnnlMJD7rpJUPka6LlaLtAtkC4t5C7JYnyVxmlNuufqq5ebqex71V6uLpsTpgXA2zabX4cEH0geG4+xNrX94acbd6V54C8SkyTH/grJJB1zh1rk/vc2qvuIfZNvU1SH8qujNuZ7mNEPivH4FR91P05qtrOCXV67S7QcybbmxdqU0px3ZQEpVz9+3vfuqIuVmuMOySrzGyhU+LHkIj8zLrg51KSDsbPlvVaSHyWa2UAm37Tv014qx+3ZWNLnQHK/7hu18E78OwPH8DtyYFhtzcZOgHHSOZ14+q191f4elWCkCzhV7XJUy9k6mEItyLkt1bjnKhtRPQ9e41XxjCb/ACblDjM5KHYs1hyQxNbfcU2oI1zDXcHrS12zY3El048Cj13N/wDA/wDQ6J/7o3us03SRPxh+M/bsuXPdUSdsLcHh613Cuh3/AJU+cIvzmS4xBubyQl51BS4E9udJIJHz1us9Zs51PG2UOu08iPitOz9rtqpXQluFwz1B8wp2iiilqcIqGzP/AJpXn/7J7/gNTNQ+ZDeJ3gD/AOTe/wCA1ZD+o3qFTUfpP6H4LPOC5BGxm/puMsOltLDjY8IbVzKToHvVmi8WEvNLZnRlNJcgutPrYAJkyFJCUuK7dkj40t6K+hz7PhmfjeM18rp9pzwMEcZy1+/BMpjiRZ22mLitm4/ebFu+7xEBT7KrprnPXf01XlRn1vAxmapVxM20BDT7II8J5A2CoHe+b50v6Y1ni2Z7hYlV6kSIrP3ooJdjtBayrk6Dr5d6w1NHTwAOsTc28QUwpa6pqSW4gLC/eCM/IcuS4jMcecF4t7z16EG4SUzEymwkPoWDsoI3+HtrrXgyvMbbkjVzdSm5MPvuMhhoO/oVIQAOZwea+/7qZDbDTWS3gxkODkssZTSmo6XHAdr6pQehV8KrdvtT90zhV1unjGJa4oeSu4xkxAtfUICh21zb6/Cl8E8Id2mEiwB135ct9gEyqKeoLRHiBxEjTdc567rk/NROKZ1bbPijVoem3eDIRJW8XYLTauZJ7J9//SvsDiLBstsTBjMyZzKp77shuSlIEhhYPRWunNvR7aq0MWVCuIljviERHGblHcD4jKDjKZCGyFAEdCD0/I1TcYRfsWy2I09BdhsXKWlhftMbo4jn6hPMPj5etWAU82J1syMVr2zzuNL5Z/RVONTBgbiyBwggXy9mx1tncKTjcUYj8yxzri3JU7CkyXXg2gEBDgIQlHXyGh9KhXeJlz9virYiwY0OLL9qEeMyGw6fVffZ0aucO5Ku2XZbBuZQIMCHIbb8JhIU03zDZGh1Oh03XVbrZjT1kxRhp5cm2OXRwFyU2EKWrkUQlXw5tCuGvp4/ei3dRYgu4aqxzKqTJk2/hY3Ba3PPTL7uoI5ji1pk3G92eLc1XW4NuIDUjlDLBX1UQR1V1rotvERmBghtIad+92krYjyABpDKlBRG97Hb08hXsylObXgyrbLsjbcIy0MsqEVKQ1tWkBCh10emz1+lT2V41El4rLssBVvcfsrSHY/gOpU+4Ug+NzpHUd/zrsupwGCQXuR+69gNL5c9OqrDaol7ojawP7bXJzNs9cr36BVzJ+ItvvMuxuRYzzDMWUmbNTygFx33dkdevQH0rvyPP7NeJLUlFxvriWpjUlEN1loMoCVDeiPe7b1171dUoaU3EbkPQHra3ZUvyLb7MFvu+5+NJ1vXbz8qi4K5MfB7Cu3i4tqXFWdRLciSFHfTnJHu/wD9rM2WCzcLNMteNzw5fVa3w1F34pAbi5y4WH93Pf4Kt3/iRb7zAv0RiKYS5jiFMvssJC32x3Q8d7+orsncTYXtl9mW8zGH5sWM1GXyAFC297J69qjeFcdUm8Xhos+I6bY+Ajl2efp2HrupjhfZ7jaBfUzoM2JI9jQtoGLzu/iPVCFD3j8K1zxU0Ie3D7tsr63ty5BYqearqCx2L3sWdtLA8/8AIrjL4txX5ljni3qDsZDzc5lICUrDgTsoPzG+tV69XXFGcekWyxR57j0mQl8vTEIBZSP1EkdSKtdvtT9zzdd2unjeyWuKl5K7jGTEC1nYQFAdAObfX4VJR7K2eIlkvbaIjjNyjOB4RlBxlMhDZCgCOh9foarbLTwuGEHIX1yuLuA06q10NVUNONwNzhzGdjZpIz6fFUi28QXLJhkW0208k9uUt1xTrKHEFs77c2+u9eVdtryywzrFDt2Rtz0uQJa5TTkMJ05zKKilQPbqfKp+Ui43LGLlJyy3NRn48pkW55cdLLq1FeikAAbGv8/SpPiQqW2ZceOLgI/OzzNi2o9nCdpJPja3/wCfSpM0Tn4AyxJJJB6aG2fvLkQTtjxl92hoABbuz1F8vd3KnW/Pov8ADu45FMYeQzKYcZQ22ApSdpCU76jyHWvDjWQWdGNzcdvzc1MR99Mlt+IAVoWABog+XSmdlyWvByb212BMgRoiQ3BZjjx4zqkjlWVAbA313UXdGZV3xeUzCbk2NqNbwp2FLgJDKgBslDuvxH5/SuWVUT2j2LA4Re+ltN1758Lc11JRzMefbxEYja2t8jfO1suN+SgkcTLa3drnJbhOGObWm3w2nkBYVy70XBvsd9RXZF4m2oXy1XJbUmMxFguR1xI7SQhlxWveb69QdefbQpY0U3OyafgdLeVkmG2qkbxrfTndWjNb7Bvq4rsa53ae62FJUZ7baeVJ0QE8nx33py8IP+YUD+s7/wCIqs5Vo3hANYFb/wCs7/4iqW7dhbDSMY3QO+RTb0bndNXvkdqW/MK50UUV5Be9RXB9lEhlbLqQttxJSpJ7EHoRRRQoKTl24DSVTXFWq6R0xVElCJCVcyB6bG9/PpXj/iFvf+1Ld/v/AOlFFNRtysaLYvIJG70coHHFh15lH8Qt7/2pbv8Af/0rt/iRyP2b2X78h+z83P4PM5yc3rrWt/Giig7cqzq4eAQPRuhGjT4lehHCLMG3S8jJ20ulIQVpedCikdhvXYelfJHCDL5ba25OStPIWAFJcddUFaOxsEddUUVz65qb3y8Au/UFJa2f/RXGPwbyuI2huPkbDKEKKkpbddSEqPQkADoa5P8AB7LpS2nJGStPLZPM2pbrqig+oJHQ0UUeuam97jwCj8v0drWNv9iutPBfKEuPOpyCMHHwUurC3NuA9wo66/WuB4I5IqOiMb5DLCFcyWipzlSr1A1oGiip9d1XEeAUfl2i4HxK9S+EmZOeFz5ShfgnbfM+6eQ+o9K87XBTJo8hchm/RW317CnULcClb77OtndFFQNs1IyBHgFJ9H6M5kH/AKK5jg5liX0PjI2A82jw0OB13mSj9kHXQfCu1nhLmcZpLTGUpabSNJQh90JHyAoooO2ak628ApHo/SDS/wD0V543BXJ4Tqnot+ix3VAgraW4lRHzAr0/xT5oHPE/hUnxNcvP4729em/Siig7ZqTmSPAKB6P0jRYX/wCiuuRwfy6Y2tuTkrT7a9BSXHXVBWuo2COtcY/BvK4jaG4+RMMoQoqQlt11IST0JAA6Giij1zU2tcW6BH5fpL3sb/7FfJXBnKpykKlZDHkKR1SXXHVcvy2Oldz3CXM5DSmnspS42ruhb7pB+hooo9c1PLwCn8v0meuf+RXUeDeVl5145GwXXk8jqy47zOJ9FHXUfA1yd4P5c/FEN3JWnIw7MredKPy1qiij1zU8R4BR+X6Tgf8Aorx/xDXv/alu/wB//Sj+IW9/7Ut3+/8A6UUV36+rP7vILj8tUH9p8Su2LwFuZfQJd3hpZ37xaQpStfDehThs9qjWS2x7dDRysR0BCATsn4n4nvRRWWq2hPVWErrgLdRbLpqMkwtsT3r2UUUVjTBf/9k=";


// ── XSS PROTECTION ──────────────────────────────────────────────────
function sanitise(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

// ── SUPABASE CLIENT (direct – working) ──────────────────────────────
const S_URL = 'https://gjznwgzoqpfdnxywixgv.supabase.co';
const S_KEY = 'sb_publishable_ZKjAmE-iA-C7KklIH1G-MA_nBAdobbI';
const sb = supabase.createClient(S_URL, S_KEY, {
    global: {
        headers: {
            'x-student-token': sessionStorage.getItem('studentToken') || ''
        }
    }
});

let localData = null;
let allMaterials = [];
let studentApi = null;
let proctorInterval;

// ── AUTH GUARD ──────────────────────────────────────────────────────
(function() {
    const token = sessionStorage.getItem("studentToken");
    if (sessionStorage.getItem("loginUser") !== "true" || !token) {
        window.location.replace("student_login.html");
    }
})();

// ── ON LOAD (ORIGINAL WORKING VERSION) ─────────────────────────────
window.onload = async function() {
    const token = sessionStorage.getItem("studentToken");
    if (sessionStorage.getItem("loginUser") !== "true" || !token) {
        window.location.replace("student_login.html");
        return;
    }

    try {
        const { data, error } = await sb.rpc('verify_student_token', { submitted_token: token });
        if (error || !data || data.length === 0) {
            ['saved_exam_progress','saved_questions_order'].forEach(k => localStorage.removeItem(k));
            sessionStorage.clear();
            window.location.replace("student_login.html");
            return;
        }

        const real = data[0];
        const deviceId = localStorage.getItem('muujiza_device_token');
        const studentPackage = {
            name: real.name,
            matrix: real.matrix_no,
            faculty: real.faculty || "Not Specified",
            dept:    real.department.toUpperCase().trim(),
            level:   String(real.level || '').replace(/L+$/i, '').trim(),
            semester: real.semester,
            deviceId: deviceId
        };
        sessionStorage.setItem('student_data', JSON.stringify(studentPackage));
        localData = studentPackage;

        // Display student details
        document.getElementById('welcomeText').innerText = `Welcome, ${localData.name.split(' ')[0]}!`;
        document.getElementById('dspName').innerText    = localData.name;
        document.getElementById('dspMatrix').innerText  = localData.matrix;
        document.getElementById('sideMatrix').innerText = localData.matrix;
        document.getElementById('dspFaculty').innerText = localData.faculty || "N/A";
        document.getElementById('dspDept').innerText    = localData.dept    || "N/A";

        const displayLevel = localData.level + 'L';
        document.getElementById('dspLevelSem').innerText = `${displayLevel} | ${localData.semester}`;

        // Start all original functions
        fetchExams();
        fetchCarryoverExams();
        fetchCaExams();
        syncGatekeeper();
        checkResultsReleased();
        checkExamCardReleased();
        checkScheduledExamCardReleased();
        setInterval(syncGatekeeper, 5000);
        setInterval(checkSession, 15000);
        setInterval(checkResultsReleased, 30000);
        setInterval(checkExamCardReleased, 30000);
        setInterval(checkScheduledExamCardReleased, 30000);
        setInterval(fetchCaExams, 30000);
        setInterval(fetchCarryoverExams, 30000);
        syncClassroom();
        setInterval(syncClassroom, 60000);
        checkForLiveClass();
        setInterval(checkForLiveClass, 30000);

        bindDashboardEvents();
        loadMyAssignments();
        setInterval(loadMyAssignments, 60000);
    } catch (e) {
        console.error("Token Verification Error:", e);
        sessionStorage.clear();
        window.location.replace("student_login.html");
    }
};

// ── EVENT BINDING (ORIGINAL) ───────────────────────────────────────
function bindDashboardEvents() {
    document.getElementById('navCourseReg')?.addEventListener('click', () => {
        // Hide main dashboard content, show registration panel
        document.querySelector('.main-content').style.display = 'none';
        document.getElementById('sec-courseReg').style.display = 'block';
        loadCourseRegistration();
    });

    // Clicking Dashboard nav item restores main content
    document.querySelector('.nav-item.active')?.addEventListener('click', () => {
        document.querySelector('.main-content').style.display = '';
        document.getElementById('sec-courseReg').style.display = 'none';
    });

    document.getElementById('downloadSlipNav')?.addEventListener('click', downloadSemesterSlipPDF);
    document.getElementById('downloadResultsNav')?.addEventListener('click', downloadResultsPDF);
    document.getElementById('downloadExamCardNav')?.addEventListener('click', downloadExamCardPDF);
    document.getElementById('navAiLink')?.addEventListener('click', () => window.location.href = 'AI11.html');
    document.getElementById('navLogout')?.addEventListener('click', logout);
    document.getElementById('navPracticeLink')?.addEventListener('click', () => window.location.href = 'practice.html');
    document.getElementById('navAssignments')?.addEventListener('click', () => {
        document.querySelector('.card:nth-child(5)')?.scrollIntoView({ behavior: 'smooth' });
    });
    document.getElementById('downloadScheduledExamCardNav')?.addEventListener('click', downloadScheduledExamCardPDF);
    document.getElementById('startExamBtn')?.addEventListener('click', verifyAndStart);

    const tokenEl = document.getElementById('examToken');
    if (tokenEl) {
        tokenEl.addEventListener('input', () => {
            const pos = tokenEl.selectionStart;
            tokenEl.value = tokenEl.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            tokenEl.setSelectionRange(pos, pos);
        });
    }

    document.getElementById('courseSearch')?.addEventListener('keyup', filterMaterials);
    document.getElementById('joinClassBtn')?.addEventListener('click', joinClass);
    document.getElementById('closeModalBtn')?.addEventListener('click', () => {
        document.getElementById('noteModal').style.display = 'none';
    });

    const resourceList = document.getElementById('resourceList');
    if (resourceList) {
        resourceList.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const action = btn.getAttribute('data-action');
            if (action === 'open-file') {
                const url = btn.getAttribute('data-url');
                if (url) window.open(url, '_blank');
            } else if (action === 'show-note') {
                const title = btn.getAttribute('data-title');
                const note = btn.getAttribute('data-note');
                document.getElementById('modalTitle').innerText = title;
                document.getElementById('modalBody').innerText = decodeURIComponent(note);
                document.getElementById('noteModal').style.display = 'block';
            }
        });
    }

    const subjectList = document.getElementById('subjectList');
    if (subjectList) {
        subjectList.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn || btn.disabled) return;
            const course = btn.getAttribute('data-course');
            if (course) selectExam(course);
        });
    }

    document.getElementById('submitAssignmentBtn')?.addEventListener('click', submitAssignment);
    const myAssignmentsList = document.getElementById('myAssignmentsList');
    if (myAssignmentsList) {
        myAssignmentsList.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            if (btn.classList.contains('delete-assign-btn')) {
                const id = btn.getAttribute('data-id');
                if (id) deleteStudentAssignment(id);
            }
        });
    }
}

// ── CORE FUNCTIONS (ORIGINAL, USING sb) ────────────────────────────

async function fetchExams() {
    const listDiv = document.getElementById("subjectList");
    if (!localData) return;

    try {
        // ── 1. Get student's registered courses for this semester ──────────
        const { data: regData } = await sb
            .from('course_registrations')
            .select('course_code')
            .eq('matrix_no', localData.matrix)
            .eq('department', localData.dept.toUpperCase().trim())
            .eq('level', localData.level)
            .eq('semester', localData.semester);

        const registeredCourses = (regData || []).map(r => r.course_code.toUpperCase().trim());

        if (registeredCourses.length === 0) {
            listDiv.innerHTML = `<div style="background:#fff3cd; border-left:5px solid #ffc107;
                padding:18px; border-radius:10px; color:#856404;">
                ⚠️ <strong>You have not registered any courses yet.</strong><br>
                Go to <em>Course Registration</em> in the sidebar to select your courses for this semester.
            </div>`;
            return;
        }

        const { data: onlineResults } = await sb.from('results')
            .select('subject, course')
            .eq('matrix_no', localData.matrix);
        const offlineResults = JSON.parse(localStorage.getItem('offline_scores') || "[]");

        const finishedSubjects = [
            ...(onlineResults ? onlineResults.map(r => (r.subject || r.course || "").toUpperCase().trim()) : []),
            ...offlineResults.map(r => (r.subject || r.course || "").toUpperCase().trim())
        ];

        const { data: exams, error } = await sb.from('questions')
            .select('course')
            .eq('department', localData.dept.toUpperCase().trim())
            .eq('level', localData.level)
            .eq('semester', localData.semester);

        if (error) throw error;

        // Only show questions for registered courses
        const allCourses = exams ? [...new Set(exams.map(e => e.course.toUpperCase().trim()))] : [];
        const uniqueCourses = allCourses.filter(c => registeredCourses.includes(c));

        if (uniqueCourses.length === 0) {
            listDiv.innerHTML = "<p style='color:gray;'>No exam questions available yet for your registered courses.</p>";
            return;
        }

        const { data: sessions } = await sb.from('exam_sessions')
            .select('course, token_code, is_active, end_time')
            .eq('department', localData.dept.toUpperCase().trim())
            .eq('level', localData.level)
            .eq('semester', localData.semester)
            .eq('is_carryover', false)
            .eq('is_ca', false);

        const now = Date.now();
        const sessionMap = {};
        (sessions || []).forEach(s => {
            const c = (s.course || '').toUpperCase().trim();
            if (c) sessionMap[c] = s;
        });

        listDiv.innerHTML = uniqueCourses.map(course => {
            const isTaken = finishedSubjects.includes(course);
            const safeCourse = sanitise(course);
            const session = sessionMap[course];
            const isOpen = session && session.is_active === "true" && now < new Date(session.end_time).getTime();
            const token = session ? session.token_code : null;

            let tokenBadge = '';
            if (isTaken) tokenBadge = '';
            else if (isOpen && token) tokenBadge = `<span style="background:#00ff88;color:#0f5132;font-family:monospace;font-weight:bold;padding:2px 10px;border-radius:12px;font-size:0.85rem;margin-left:8px;">🔓 ${sanitise(token)}</span>`;
            else if (session && !isOpen) tokenBadge = `<span style="background:#ff4444;color:white;font-size:0.75rem;padding:2px 8px;border-radius:12px;margin-left:8px;">GATE CLOSED</span>`;

            const btnHtml = isTaken
                ? `<button disabled style="background:#eeeeee; color:#aaaaaa; border:none; padding:8px 15px; border-radius:5px; font-weight:bold;">BIT-TAWFEEQ</button>`
                : `<button data-course="${safeCourse}" style="background:#0f5132; color:#00ff88; border:none; padding:8px 15px; border-radius:5px; cursor:pointer; font-weight:bold;">SELECT</button>`;

            return `
                <div class="exam-item" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding:15px; background:white; border-radius:8px; border-left: 5px solid ${isTaken ? '#ff4444' : (isOpen ? '#00ff88' : '#cccccc')}">
                    <div>
                        <b style="color: ${isTaken ? '#999' : '#333'}">${safeCourse} ${isTaken ? '(SUBMITTED)' : ''}</b>
                        ${tokenBadge}
                    </div>
                    ${btnHtml}
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error("fetchExams Error:", err);
        listDiv.innerHTML = "Error loading subjects.";
    }
}

function selectExam(course) {
    localStorage.removeItem('exam_questions');
    localStorage.removeItem('student_answers');
    localStorage.removeItem('current_index');
    sessionStorage.setItem('activeSubject', course.toUpperCase().trim());
    sessionStorage.removeItem('examSessionType');

    const examItems = document.querySelectorAll('#subjectList .exam-item');
    let autoToken = null;
    examItems.forEach(item => {
        const b = item.querySelector('b');
        if (b && b.textContent.trim().startsWith(course)) {
            const badge = item.querySelector('span[style*="monospace"]');
            if (badge) {
                const match = badge.textContent.replace('🔓', '').trim();
                if (match && match.length === 6) autoToken = match;
            }
        }
    });

    const tokenInput = document.getElementById('examToken');
    if (autoToken) {
        tokenInput.value = autoToken;
        document.getElementById('selectedCourseText').textContent = `✅ ${course} selected — token pre-filled. Click START EXAMINATION.`;
    } else {
        tokenInput.value = '';
        document.getElementById('selectedCourseText').textContent = `✅ ${course} selected — enter your token below.`;
    }
    tokenInput.focus();
}

async function verifyAndStart() {
    const activeSub = sessionStorage.getItem('activeSubject');
    const student = JSON.parse(sessionStorage.getItem('student_data'));
    const tokenInput = document.getElementById('examToken').value.trim().toUpperCase();

    if (!activeSub || activeSub === "null") return alert("❌ Please select a course first.");

    const attemptKey   = 'token_attempts_' + activeSub;
    const lockKey      = 'token_lockout_' + activeSub;
    const lockoutUntil = parseInt(sessionStorage.getItem(lockKey) || '0');
    if (Date.now() < lockoutUntil) {
        const mins = Math.ceil((lockoutUntil - Date.now()) / 60000);
        return alert(`⛔ Too many incorrect token attempts. Wait ${mins} minute(s) or contact your invigilator.`);
    }
    const attempts = parseInt(sessionStorage.getItem(attemptKey) || '0');

    try {
        const { data: existingResult, error: resultErr } = await sb
            .from('results')
            .select('id, score')
            .eq('matrix_no', student.matrix)
            .or(`subject.eq.${activeSub},course.eq.${activeSub}`)
            .maybeSingle();

        if (resultErr) throw resultErr;
        if (existingResult && parseFloat(existingResult.score) >= 50) {
            return alert(`⛔ ACCESS DENIED: ${student.name.split(' ')[0]}, you have already passed ${activeSub} with ${existingResult.score}%.`);
        }

        let { data: session, error } = await sb.from('exam_sessions')
            .select('*')
            .eq('token_code', tokenInput)
            .eq('department', student.dept)
            .eq('level', student.level)
            .eq('semester', student.semester)
            .eq('course', activeSub)
            .eq('is_carryover', false)
            .eq('is_ca', false)
            .maybeSingle();

        if (!session && (!error || error.code === 'PGRST116')) {
            const { data: carrySession } = await sb.from('exam_sessions')
                .select('*')
                .eq('token_code', tokenInput)
                .eq('department', student.dept)
                .eq('carryover_course', activeSub)
                .eq('is_carryover', true)
                .maybeSingle();
            if (carrySession) session = carrySession;
        }

        // CA fallback
        if (!session) {
            const { data: caSession } = await sb.from('exam_sessions')
                .select('*')
                .eq('token_code', tokenInput)
                .eq('department', student.dept)
                .eq('course', activeSub)
                .eq('is_ca', true)
                .maybeSingle();
            if (caSession) {
                session = caSession;
                sessionStorage.setItem('examSessionType', 'ca');
            }
        }

        if (error && !session) {
            sessionStorage.setItem(attemptKey, attempts + 1);
            if (attempts + 1 >= 3) sessionStorage.setItem(lockKey, Date.now() + 10 * 60 * 1000);
            return alert("❌ Invalid Token. This token does not match your course, department, level or semester.");
        }
        if (!session) {
            sessionStorage.setItem(attemptKey, attempts + 1);
            if (attempts + 1 >= 3) sessionStorage.setItem(lockKey, Date.now() + 10 * 60 * 1000);
            return alert("❌ Invalid Token. No matching exam session found.");
        }

        const now = new Date().getTime();
        const endTime = new Date(session.end_time).getTime();
        if (session.is_active !== "true") return alert("⛔ The Gate is CLOSED by the Admin.");
        if (now > endTime) return alert("⏰ Time Expired. Entry locked.");

        sessionStorage.removeItem(attemptKey);
        sessionStorage.removeItem(lockKey);
        sessionStorage.setItem('examSessionEndTime', session.end_time);
        window.location.replace("exam.html");
    } catch (err) {
        console.error(err);
        alert("Security sync failed. Try again.");
    }
}

async function syncGatekeeper() {
    if (!localData) return;
    try {
        const { data, error } = await sb.from('exam_sessions')
            .select('token_code, is_active, end_time, course')
            .eq('department', localData.dept)
            .eq('level', localData.level)
            .eq('semester', localData.semester)
            .eq('is_carryover', false)
            .eq('is_ca', false);

        const gateBadge    = document.getElementById('gateBadge');
        const displayToken = document.getElementById('displayToken');
        const tokenInstr   = document.getElementById('tokenInstruction');

        if (error || !data || data.length === 0) {
            gateBadge.innerText = "NO SESSION"; gateBadge.style.background = "#555"; gateBadge.style.color = "white";
            displayToken.innerText = "----";
            if (tokenInstr) tokenInstr.innerText = "Wait for the admin to open the gate.";
            return;
        }

        const now = Date.now();
        const openSessions = data.filter(s => s.is_active === "true" && now < new Date(s.end_time).getTime());

        if (openSessions.length > 0) {
            const first = openSessions[0];
            gateBadge.innerText = `GATE OPEN (${openSessions.length} course${openSessions.length > 1 ? 's' : ''})`;
            gateBadge.style.background = "#00ff88"; gateBadge.style.color = "#0f5132";
            displayToken.innerText = openSessions.length === 1 ? first.token_code : "▼ See list";
            displayToken.style.fontSize = openSessions.length === 1 ? "3em" : "1.5em";
            if (tokenInstr) tokenInstr.innerText = openSessions.length === 1
                ? `Token for ${sanitise(first.course)} — select it above then click START.`
                : "Multiple courses are open — select your course above to see its token.";
            fetchExams();
        } else {
            gateBadge.innerText = "GATE CLOSED"; gateBadge.style.background = "#ff4444"; gateBadge.style.color = "white";
            displayToken.innerText = "----"; displayToken.style.fontSize = "3em";
            if (tokenInstr) tokenInstr.innerText = "Wait for the admin to open the gate.";
        }
    } catch (e) { /* silent */ }
}

async function checkSession() {
    if (!localData) return;
    const { data } = await sb.from('students').select('current_device_id').eq('matrix_no', localData.matrix).single();
    if (data && data.current_device_id !== localData.deviceId) { alert("Session active on another device."); logout(); }
}

async function fetchCarryoverExams() {
    const listDiv = document.getElementById('carryoverSubjectList');
    if (!listDiv || !localData) return;

    try {
        // ── Gate: only compute eligibility once results are officially released ──
        const { data: releasedData } = await sb.rpc('is_results_released', {
            p_dept:     localData.dept.trim().toUpperCase(),
            p_level:    localData.level,
            p_semester: localData.semester
        });
        if (releasedData !== true) {
            listDiv.innerHTML = '<p style="color:#a0aec0;">Carryover status will be shown once results are officially released.</p>';
            return;
        }

        const { data: sessions, error } = await sb
            .from('exam_sessions')
            .select('*')
            .eq('is_carryover', true)
            .eq('is_active', 'true')
            .eq('department', localData.dept)
            .eq('original_level', localData.level)
            .eq('original_semester', localData.semester)
            .order('carryover_course', { ascending: true });

        if (error) throw error;
        if (!sessions || sessions.length === 0) {
            listDiv.innerHTML = '<p style="color:#a0aec0;">No carryover exams available right now.</p>';
            return;
        }

        const { data: results, error: resErr } = await sb
            .from('results')
            .select('subject, score')
            .eq('matrix_no', localData.matrix);
        if (resErr) throw resErr;

        const passedCourses = new Set();
        (results || []).forEach(r => {
            const score = parseFloat(r.score);
            const course = (r.subject || '').toUpperCase().trim();
            if (!isNaN(score) && score >= 50) passedCourses.add(course);
        });

        const eligible = sessions.filter(s => {
            const courseCode = (s.carryover_course || '').toUpperCase().trim();
            return !passedCourses.has(courseCode);
        });

        if (eligible.length === 0) {
            listDiv.innerHTML = '<p style="color:#a0aec0;">No carryover exams available for you.</p>';
            return;
        }

        // ── Only show carryover courses that still have questions in the bank ──
        // Each carryover course belongs to its original level+semester, so we
        // check per-session using original_level and original_semester.
        const coChecks = await Promise.all(eligible.map(async s => {
            const course   = (s.carryover_course || '').toUpperCase().trim();
            const origLvl  = s.original_level  || localData.level;
            const origSem  = s.original_semester || localData.semester;
            const { data } = await sb.from('questions').select('course', { count: 'exact', head: true })
                .eq('department', localData.dept.toUpperCase().trim())
                .eq('level',    origLvl)
                .eq('semester', origSem)
                .eq('course',   course);
            // data will be null for a head query; use count from response — but
            // head:true returns count in the response object. Check via non-head:
            const { data: qRows } = await sb.from('questions').select('id')
                .eq('department', localData.dept.toUpperCase().trim())
                .eq('level',    origLvl)
                .eq('semester', origSem)
                .ilike('course', course)
                .limit(1);
            return { s, hasQuestions: !!(qRows && qRows.length > 0) };
        }));
        const eligibleWithQ = coChecks.filter(r => r.hasQuestions).map(r => r.s);

        if (eligibleWithQ.length === 0) {
            listDiv.innerHTML = '<p style="color:#a0aec0;">No carryover exams available right now.</p>';
            return;
        }

        listDiv.innerHTML = eligibleWithQ.map(s => {
            const safeCourse = sanitise(s.carryover_course);
            return `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding:15px; background:white; border-radius:8px; border-left:5px solid #ff9800;">
                    <div>
                        <b style="color:#333;">${safeCourse}</b>
                        <small style="color:#666; display:block;">Original: ${sanitise(s.original_level)}L | ${sanitise(s.original_semester)} Semester</small>
                    </div>
                    <button data-course="${safeCourse}" 
                            data-token="${sanitise(s.token_code)}"
                            data-orig-level="${sanitise(s.original_level)}"
                            data-orig-sem="${sanitise(s.original_semester)}"
                            class="select-carryover-btn"
                            style="background:#ff9800; color:white; border:none; padding:8px 15px; border-radius:5px; cursor:pointer; font-weight:bold;">
                        SELECT
                    </button>
                </div>
            `;
        }).join('');

        document.querySelectorAll('.select-carryover-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const course  = btn.getAttribute('data-course');
                const token   = btn.getAttribute('data-token');
                const origLvl = btn.getAttribute('data-orig-level');
                const origSem = btn.getAttribute('data-orig-sem');
                sessionStorage.setItem('activeSubject', course);
                sessionStorage.setItem('examSessionType', 'carryover');
                sessionStorage.setItem('carryoverOriginalLevel', origLvl);
                sessionStorage.setItem('carryoverOriginalSemester', origSem);
                const tokenInput = document.getElementById('examToken');
                if (tokenInput) tokenInput.value = token;
                alert(`Carryover selected: ${course}. The token is ready – click "Start Exam" to begin.`);
                tokenInput?.focus();
            });
        });
    } catch (err) {
        console.error("Carryover fetch error:", err);
        listDiv.innerHTML = '<p style="color:red;">Error loading carryover exams.</p>';
    }
}

async function fetchCaExams() {
    const listDiv = document.getElementById('caSubjectList');
    if (!listDiv || !localData) return;

    try {
        // ── Get registered courses first ───────────────────────────────────
        const { data: regData } = await sb
            .from('course_registrations')
            .select('course_code')
            .eq('matrix_no', localData.matrix)
            .eq('department', localData.dept.toUpperCase().trim())
            .eq('level', localData.level)
            .eq('semester', localData.semester);

        const registeredCourses = (regData || []).map(r => r.course_code.toUpperCase().trim());

        if (registeredCourses.length === 0) {
            listDiv.innerHTML = '<p style="color:#a0aec0;">Complete course registration first to see CA exams.</p>';
            return;
        }

        const { data: sessions, error } = await sb
            .from('exam_sessions')
            .select('*')
            .eq('is_ca', true)
            .eq('is_active', 'true')
            .eq('department', localData.dept)
            .eq('level', localData.level)
            .eq('semester', localData.semester)
            .order('course', { ascending: true });

        if (error) throw error;
        if (!sessions || sessions.length === 0) {
            listDiv.innerHTML = '<p style="color:#a0aec0;">No CA exams available right now.</p>';
            return;
        }

        // Filter out courses already passed
        const { data: results } = await sb
            .from('results')
            .select('subject, score')
            .eq('matrix_no', localData.matrix);

        const passedCourses = new Set();
        (results || []).forEach(r => {
            if (!isNaN(parseFloat(r.score)) && parseFloat(r.score) >= 50)
                passedCourses.add((r.subject || '').toUpperCase().trim());
        });

        const eligible = sessions.filter(s =>
            !passedCourses.has((s.course || '').toUpperCase().trim()) &&
            registeredCourses.includes((s.course || '').toUpperCase().trim())
        );

        if (eligible.length === 0) {
            listDiv.innerHTML = '<p style="color:#a0aec0;">No CA exams available for you.</p>';
            return;
        }

        // ── Only show CA courses that still have questions in the bank ──────
        // CA is a pre-exam test for the student's current dept + level + semester.
        const caCodes = eligible.map(s => (s.course || '').toUpperCase().trim()).filter(Boolean);
        const { data: caQData } = await sb.from('questions').select('course')
            .eq('department', localData.dept.toUpperCase().trim())
            .eq('level',      localData.level)
            .eq('semester',   localData.semester)
            .in('course',     caCodes);
        const caHasQuestions = new Set((caQData || []).map(q => (q.course || '').toUpperCase().trim()));
        const eligibleWithQ  = eligible.filter(s => caHasQuestions.has((s.course || '').toUpperCase().trim()));

        if (eligibleWithQ.length === 0) {
            listDiv.innerHTML = '<p style="color:#a0aec0;">No CA exams available right now.</p>';
            return;
        }

        listDiv.innerHTML = eligibleWithQ.map(s => {
            const safeCourse = sanitise(s.course);
            return `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding:15px; background:white; border-radius:8px; border-left:5px solid #3b82f6;">
                    <div>
                        <b style="color:#333;">${safeCourse}</b>
                        <small style="color:#666; display:block;">${sanitise(localData.level)}L | ${sanitise(localData.semester)} Semester</small>
                    </div>
                    <button data-course="${safeCourse}"
                            data-token="${sanitise(s.token_code)}"
                            class="select-ca-btn"
                            style="background:#3b82f6; color:white; border:none; padding:8px 15px; border-radius:5px; cursor:pointer; font-weight:bold;">
                        SELECT
                    </button>
                </div>
            `;
        }).join('');

        document.querySelectorAll('.select-ca-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const course = btn.getAttribute('data-course');
                const token  = btn.getAttribute('data-token');
                sessionStorage.setItem('activeSubject', course);
                sessionStorage.setItem('examSessionType', 'ca');
                const tokenInput = document.getElementById('examToken');
                if (tokenInput) tokenInput.value = token;
                document.getElementById('selectedCourseText').textContent =
                    `✅ CA: ${course} selected — token pre-filled. Click START EXAMINATION.`;
                tokenInput?.focus();
            });
        });
    } catch (err) {
        console.error('CA fetch error:', err);
        listDiv.innerHTML = '<p style="color:red;">Error loading CA exams.</p>';
    }
}

async function logout() {
    const token = sessionStorage.getItem("studentToken");
    if (token) {
        try {
            await sb.from('students').update({ session_token: null, session_expires_at: null }).eq('session_token', token);
        } catch(e) {}
    }
    ['saved_exam_progress','saved_questions_order','offline_scores'].forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
    window.location.replace("student_login.html");
}

// ── RESOURCES (ORIGINAL) ───────────────────────────────────────────
function renderList(items, highlightedCourse) {
    const listDiv = document.getElementById('resourceList');
    if (!listDiv) return;
    if (items.length === 0) {
        listDiv.innerHTML = '<p style="text-align:center; color:#a0aec0; padding:20px;">No materials found in the database.</p>';
        return;
    }

    listDiv.innerHTML = items.map(item => {
        const isFile = !!(item.file_url && item.file_url.trim());
        const itemCourse = sanitise((item.course || "GENERAL").toUpperCase().trim());
        const safeTitle = sanitise(item.title || '');
        const safeFileUrl = sanitise(item.file_url || '');
        const safeNote = encodeURIComponent(item.note_content || '');
        const isRecommended = highlightedCourse && itemCourse === sanitise(highlightedCourse.toUpperCase().trim());
        const cardStyle = isRecommended 
            ? 'border: 2px solid #00ff88; background: #f0fff4; box-shadow: 0 4px 12px rgba(0,255,136,0.1);' 
            : 'border-bottom: 1px solid #f7fafc; background: white;';

        const btn = isFile
            ? `<button data-action="open-file" data-url="${safeFileUrl}" style="background: ${isRecommended ? '#0f5132' : '#2b6cb0'}; color: #00ff88; border: none; padding: 10px 18px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 0.8rem;">${isRecommended ? 'STUDY NOW' : 'OPEN'}</button>`
            : `<button data-action="show-note" data-title="${safeTitle}" data-note="${safeNote}" style="background: ${isRecommended ? '#0f5132' : '#2b6cb0'}; color: #00ff88; border: none; padding: 10px 18px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 0.8rem;">${isRecommended ? 'STUDY NOW' : 'OPEN'}</button>`;

        return `
            <div class="res-item" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; margin-bottom: 8px; border-radius: 10px; ${cardStyle}">
                <div style="flex: 1;">
                    ${isRecommended ? '<span style="color:#0f5132; font-size:0.65rem; font-weight:800;">⭐ RECOMMENDED REVIEW</span>' : ''}
                    <span style="display: block; font-weight: 700; color: #2d3748; font-size: 1rem;">${safeTitle.toUpperCase()}</span>
                    <small style="color: #718096; font-weight: bold; text-transform: uppercase; font-size: 0.7rem;">CODE: ${itemCourse} • ${isFile ? '📁 PDF DOCUMENT' : '📝 NOTE'}</small>
                </div>
                ${btn}
            </div>
        `;
    }).join('');
}

function filterMaterials() {
    const query = document.getElementById('courseSearch').value.toLowerCase().replace(/\s/g, '');
    const lastExamCourse = localStorage.getItem('last_exam_course');
    const filtered = allMaterials.filter(item => {
        const title = (item.title || "").toLowerCase().replace(/\s/g, '');
        const course = (item.course || "").toLowerCase().replace(/\s/g, '');
        return title.includes(query) || course.includes(query);
    });
    renderList(filtered, lastExamCourse);
}

async function syncClassroom() {
    const lastExamCourse = localStorage.getItem('last_exam_course');
    try {
        const { data: ann } = await sb.from('exam_sessions').select('announcement').eq('id', 1).maybeSingle();
        const annBox = document.getElementById('announcementBox');
        if (ann && ann.announcement) {
            annBox.style.display = "block";
            document.getElementById('newsText').innerText = ann.announcement;
        } else annBox.style.display = "none";

        const { data: res, error: rErr } = await sb.from('resources').select('*').order('created_at', { ascending: false });
        if (rErr) return;
        if (res) {
            allMaterials = res;
            if (lastExamCourse) {
                const target = lastExamCourse.toUpperCase().trim();
                allMaterials.sort((a, b) => (b.course || "").toUpperCase().trim() === target ? 1 : -1);
            }
            renderList(allMaterials, lastExamCourse);
        }
    } catch (e) { console.error("Sync Process Error:", e); }
}

// ── LIVE CLASS (ORIGINAL) ──────────────────────────────────────────
async function checkForLiveClass() {
    const { data, error } = await sb.from('live_classes').select('*').eq('is_active', true).single();
    if (data) {
        window.currentRoomId = data.room_id;
        document.getElementById('liveCourseName').textContent = data.course_code;
        document.getElementById('classAlert').style.display = 'block';
    } else {
        document.getElementById('classAlert').style.display = 'none';
    }
}

async function joinClass() {
    if (!localData) return alert("Student data not loaded. Please refresh.");
    document.getElementById('classAlert').style.display = 'none';
    const container = document.querySelector('#studentVideoContainer');
    container.innerHTML = "";
    const options = {
        roomName: window.currentRoomId,
        width: "100%",
        height: 550,
        parentNode: container,
        userInfo: { displayName: `${localData.name} (${localData.matrix})` },
        configOverwrite: { startWithAudioMuted: true, startWithVideoMuted: true, disableProfile: true },
        interfaceConfigOverwrite: { TOOLBAR_BUTTONS: ['microphone','camera','chat','raisehand','tileview','fullscreen'] }
    };
    try { studentApi = new JitsiMeetExternalAPI("meet.jit.si", options); } catch (err) { alert("Video load failed."); }
}

// ── RESULTS (ORIGINAL PDF) ─────────────────────────────────────────
async function checkResultsReleased() {
    if (!localData) return;

    // ── Full transcript: independent check via is_results_released RPC ──
    try {
        const { data: transcriptData } = await sb.rpc('is_results_released', {
            p_dept:     localData.dept.trim().toUpperCase(),
            p_level:    localData.level,
            p_semester: localData.semester
        });
        const transcriptNav = document.getElementById('downloadResultsNav');
        if (transcriptNav) transcriptNav.style.display = transcriptData === true ? 'flex' : 'none';
    } catch (e) {
        console.error("Error checking full transcript release:", e);
        const tn = document.getElementById('downloadResultsNav');
        if (tn) tn.style.display = 'none';
    }

    // ── Semester slip: read slip_released from registration_control ──
    // Uses registration_control (already student-readable) to avoid RLS
    // blocking on admin_settings. Admin writes slip_released=true/false there.
    try {
        const { data: slipRow } = await sb
            .from('registration_control')
            .select('slip_released')
            .eq('department', localData.dept.trim().toUpperCase())
            .eq('level', localData.level)
            .eq('semester', localData.semester)
            .maybeSingle();
        const slipOpen = slipRow && slipRow.slip_released === true;
        const slipNav  = document.getElementById('downloadSlipNav');
        if (slipNav) slipNav.style.display = slipOpen ? 'flex' : 'none';
    } catch (e) {
        console.error("Error checking semester slip release:", e);
        const sn = document.getElementById('downloadSlipNav');
        if (sn) sn.style.display = 'none';
    }
}

// ── GRADING HELPER ────────────────────────────────────────────────────
function computeGrade(total) {
    if (total >= 70) return { grade: 'A', remark: 'Excellent' };
    if (total >= 60) return { grade: 'B', remark: 'Very Good' };
    if (total >= 50) return { grade: 'C', remark: 'Good' };
    if (total >= 40) return { grade: 'D', remark: 'Pass' };
    return { grade: 'F', remark: 'Fail' };
}

// ── GPA HELPERS ───────────────────────────────────────────────────────
function gradePoint(grade) {
    // Nigerian polytechnic / college of health grading scale (5-point)
    if (grade === 'A') return 5;
    if (grade === 'B') return 4;
    if (grade === 'C') return 3;
    if (grade === 'D') return 2;
    return 0; // F
}

function computeGPA(courseEntries) {
    // courseEntries: [{ total, grade, creditUnits }, ...]
    let totalQP = 0, totalUnits = 0;
    for (const c of courseEntries) {
        if (c.grade === 'F' || c.creditUnits === 0) {
            totalQP    += 0;
            totalUnits += c.creditUnits;
        } else {
            totalQP    += gradePoint(c.grade) * c.creditUnits;
            totalUnits += c.creditUnits;
        }
    }
    if (totalUnits === 0) return { gpa: null, totalUnits: 0, totalQP: 0 };
    return { gpa: (totalQP / totalUnits).toFixed(2), totalUnits, totalQP };
}

function remarkFor(gpa) {
    const g = parseFloat(gpa);
    if (g >= 3.5) return 'Distinction';
    if (g >= 3.0) return 'Upper Credit';
    if (g >= 2.0) return 'Lower Credit';
    if (g >= 1.0) return 'Pass';
    return 'Fail';
}

function buildSemesterTableHTML(semesterLabel, courseMap, catalogMap) {
    const courseEntries = [];
    let rowIdx = 0;
    const rows = Object.entries(courseMap).map(([course, data]) => {
        rowIdx++;
        // CA and Exam scores are stored as direct /30 and /70 values (no weighting needed)
        const caScore   = data.ca   ? Math.min(30, Math.round(parseFloat(data.ca.score)))   : 0;
        const examScore = data.exam ? Math.min(70, Math.round(parseFloat(data.exam.score))) : 0;
        const total     = Math.min(100, caScore + examScore);
        const { grade, remark } = computeGrade(total);
        const catEntry    = catalogMap[course];
        const creditUnits = catEntry !== undefined ? (catEntry.units !== undefined ? catEntry.units : catEntry) : 3;
        const courseTitle = (catEntry && catEntry.title) ? catEntry.title : '—';
        const gp          = gradePoint(grade);
        const qp          = gp * creditUnits;
        const gradeColor  = grade === 'F' ? '#cc0000' : grade === 'D' ? '#b45309' : '#0f5132';
        const bg          = rowIdx % 2 === 0 ? '#f9f9f9' : '#fff';

        courseEntries.push({ course, total, grade, creditUnits, gp, qp });

        return `
        <tr style="background:${bg}">
            <td style="text-align:center;">${rowIdx}</td>
            <td style="font-weight:bold; letter-spacing:0.4px;">${course}</td>
            <td style="color:#555;">${courseTitle}</td>
            <td style="text-align:center; font-weight:bold; color:#0f5132;">${creditUnits}</td>
            <td style="text-align:center; font-weight:bold; color:${gradeColor};">${grade}</td>
            <td style="text-align:center;">
                <span class="remark-pill" style="background:${grade === 'F' ? '#fee2e2' : '#d1fae5'}; color:${gradeColor};">
                    ${remark}
                </span>
            </td>
        </tr>`;
    }).join('');

    const { gpa, totalUnits, totalQP } = computeGPA(courseEntries);
    const gpaColor = gpa === null ? '#555' : parseFloat(gpa) >= 3.5 ? '#0f5132' : parseFloat(gpa) >= 2.0 ? '#b45309' : '#cc0000';

    const semBlock = `
    <div class="sem-block">
      <div class="sem-title">${semesterLabel} Semester Results</div>
      <table>
        <thead>
          <tr>
            <th style="width:36px;">S/N</th>
            <th style="width:80px;">Course Code</th>
            <th>Course Title</th>
            <th style="width:52px; text-align:center;">Credit</th>
            <th style="width:60px; text-align:center;">Grade</th>
            <th style="width:110px; text-align:center;">Remark</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      ${gpa !== null ? `
      <div class="sem-gpa-line">
        Total Units: <strong>${totalUnits}</strong> &nbsp;|&nbsp; Total QP: <strong>${totalQP}</strong> &nbsp;|&nbsp;
        GPA (${semesterLabel} Semester): <strong style="color:${gpaColor}; font-size:1rem;">${gpa}</strong> (${remarkFor(gpa)})
      </div>` : ''}
    </div>`;

    return { html: semBlock, totalUnits, totalQP, gpa };
}

async function downloadResultsPDF() {
    if (!localData) return alert("Student data not loaded.");

    // 1. Fetch all results for this student
    const { data: results, error } = await sb.from('results')
        .select('*')
        .eq('matrix_no', localData.matrix)
        .order('created_at', { ascending: true });
    if (error || !results || results.length === 0) return alert("No results yet.");

    // 2. Collect unique course codes to look up credit units
    const courseKeys = [...new Set(results.map(r => (r.subject || r.course || 'N/A').toUpperCase()))];

    // 3. Fetch credit units and course titles from course_catalog (fallback = 3 units if not found)
    let catalogMap = {};
    try {
        const { data: catalog } = await sb.from('course_catalog')
            .select('course_code, credit_units, course_title, semester')
            .eq('department', localData.dept.toUpperCase().trim())
            .eq('level', localData.level)
            .in('course_code', courseKeys);
        if (catalog) {
            catalog.forEach(c => {
                catalogMap[c.course_code.toUpperCase()] = {
                    units: c.credit_units,
                    title: c.course_title || '—'
                };
            });
        }
    } catch (e) { /* catalog may not exist yet — use fallback */ }

    // 4. Group by semester first, then by course: pair exam + CA
    const semesterMap = {}; // { '1st': { COURSE: {ca, exam} }, '2nd': {...} }
    for (const r of results) {
        const sem = r.semester || localData.semester || '1st';
        const key = (r.subject || r.course || 'N/A').toUpperCase();
        if (!semesterMap[sem]) semesterMap[sem] = {};
        if (!semesterMap[sem][key]) semesterMap[sem][key] = { exam: null, ca: null };
        if (r.is_ca) semesterMap[sem][key].ca   = r;
        else         semesterMap[sem][key].exam = r;
    }

    // 5. Build a table block per semester + accumulate for true CGPA
    const semesterOrder = ['1st', '2nd'].filter(s => semesterMap[s]);
    Object.keys(semesterMap).forEach(s => { if (!semesterOrder.includes(s)) semesterOrder.push(s); });

    let combinedUnits = 0, combinedQP = 0;
    const semesterBlocksHTML = semesterOrder.map(sem => {
        const { html, totalUnits, totalQP } = buildSemesterTableHTML(sem, semesterMap[sem], catalogMap);
        combinedUnits += totalUnits;
        combinedQP    += totalQP;
        return html;
    }).join('');

    // 6. True CGPA = combined Quality Points ÷ combined Credit Units across BOTH semesters
    const cgpa = combinedUnits > 0 ? (combinedQP / combinedUnits).toFixed(2) : null;
    const cgpaColor = cgpa === null ? '#555' : parseFloat(cgpa) >= 3.5 ? '#0f5132' : parseFloat(cgpa) >= 2.0 ? '#b45309' : '#cc0000';
    const cgpaBlock = cgpa !== null ? `
        <div class="gpa-box">
            <div class="gpa-item"><label>Total Credit Units</label><span>${combinedUnits}</span></div>
            <div class="gpa-item"><label>Total Quality Points</label><span>${combinedQP}</span></div>
            <div class="gpa-item"><label>Cumulative GPA (CGPA)</label>
                <span style="color:${cgpaColor}; font-size:1.4rem;">${cgpa}</span>
            </div>
            <div class="gpa-item"><label>CGPA Remark</label>
                <span style="color:${cgpaColor};">${remarkFor(cgpa)}</span>
            </div>
        </div>` : '';

    const printHTML = `<!DOCTYPE html>
<html><head><title>Result Slip — ${localData.name}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; padding: 24px; color: #111; font-size: 11.5px; }
  .header { text-align:center; border-bottom: 3px solid #0f5132; padding-bottom:12px; margin-bottom:16px; }
  .header h1 { color:#0f5132; font-size:1.25rem; margin-bottom:4px; }
  .header p  { color:#555; font-size:0.75rem; }
  .info-box  { display:grid; grid-template-columns:1fr 1fr; gap:8px 30px; border:1px solid #ccc; border-radius:8px; padding:12px 16px; margin-bottom:16px; background:#f9fdfb; }
  .info-item label { display:block; font-size:0.64rem; color:#888; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px; }
  .info-item span  { font-weight:bold; color:#0f5132; font-size:0.9rem; }
  .sem-block { margin-bottom:10px; page-break-inside: avoid; }
  .sem-title { font-weight:bold; color:#0f5132; font-size:0.85rem; margin-bottom:5px; letter-spacing:0.4px; text-transform:uppercase; }
  table { width:100%; border-collapse:collapse; }
  thead tr { background:#0f5132; color:white; }
  th { padding:6px 8px; text-align:left; font-size:0.7rem; letter-spacing:0.3px; }
  td { border:1px solid #ddd; padding:5px 8px; font-size:0.74rem; }
  .remark-pill { display:inline-block; padding:2px 8px; border-radius:10px; font-size:0.68rem; font-weight:bold; }
  .sem-gpa-line { margin-top:5px; padding:6px 10px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; font-size:0.72rem; color:#14532d; }
  .key-box { margin-top:14px; padding:9px 13px; background:#f0fdf4; border:1px solid #86efac; border-radius:8px; font-size:0.7rem; color:#14532d; }
  .key-box strong { display:block; margin-bottom:3px; }
  .gpa-box { display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:10px 18px; border:2px solid #0f5132; border-radius:10px; padding:13px 18px; margin-top:14px; background:#f0fdf4; page-break-inside: avoid; }
  .gpa-item label { display:block; font-size:0.62rem; color:#888; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:3px; }
  .gpa-item span  { font-weight:bold; color:#0f5132; font-size:1rem; }
  .footer { margin-top:18px; text-align:center; font-size:0.65rem; color:#aaa; border-top:1px solid #eee; padding-top:8px; }
  @media print { body { padding:14px; } }
</style>
</head>
<body>
  <div class="header">
    <div style="display:flex; flex-direction:column; align-items:center; text-align:center; margin-bottom:8px;">
      <img src="${INSTITUTION_LOGO}" alt="Institution Logo" style="width:55px; height:auto; margin-bottom:5px;">
      <div style="font-weight:bold; color:#0f5132; font-size:0.88rem; letter-spacing:0.3px;">${INSTITUTION_NAME}</div>
      <div style="font-size:0.66rem; color:#666;">${INSTITUTION_ADDRESS}</div>
    </div>
    <h1>FULL ACADEMIC TRANSCRIPT</h1>
    <p style="font-size:0.8rem; color:#0f5132; font-weight:bold; letter-spacing:0.5px;">CUMULATIVE RESULT RECORD — ALL SEMESTERS</p>
    <p>POWERED BY MU'UJIZA DATA &nbsp;|&nbsp; Generated: ${new Date().toLocaleDateString()}</p>
  </div>
  <div class="info-box">
    <div class="info-item"><label>Full Name</label><span>${localData.name}</span></div>
    <div class="info-item"><label>Matrix Number</label><span>${localData.matrix}</span></div>
    <div class="info-item"><label>Faculty</label><span>${localData.faculty || 'N/A'}</span></div>
    <div class="info-item"><label>Department</label><span>${localData.dept}</span></div>
    <div class="info-item"><label>Level</label><span>${localData.level}L</span></div>
    <div class="info-item"><label>Session Semesters</label><span>${semesterOrder.join(' & ')} Semester</span></div>
  </div>
  ${semesterBlocksHTML}
  ${cgpaBlock}
  <div class="key-box">
    <strong>Nigerian NUC / NCCE Approved Grading Scale:</strong>
    A — Excellent &nbsp;|&nbsp; B — Very Good &nbsp;|&nbsp; C — Good &nbsp;|&nbsp; D — Pass &nbsp;|&nbsp; F — Fail
    <br>Distinction ≥ 3.50 &nbsp;|&nbsp; Upper Credit ≥ 3.00 &nbsp;|&nbsp; Lower Credit ≥ 2.00 &nbsp;|&nbsp; Pass ≥ 1.00 &nbsp;|&nbsp; Fail &lt; 1.00
  </div>
  <div class="footer">CBT SYSTEM © ${new Date().getFullYear()} &nbsp;|&nbsp; POWERED BY MU'UJIZA DATA &nbsp;|&nbsp; This document is auto-generated.</div>
</body></html>`;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert("⚠️ Pop-up blocked! Please allow pop-ups for this site in your browser, then try again.");
    printWindow.document.write(printHTML);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
}

// ── SEMESTER RESULT SLIP (current semester only, HOD signature line) ──
async function downloadSemesterSlipPDF() {
    if (!localData) return alert("Student data not loaded.");

    // Fetch only this semester's results
    const { data: results, error } = await sb.from('results')
        .select('*')
        .eq('matrix_no', localData.matrix)
        .eq('semester', localData.semester)
        .eq('level', localData.level)
        .order('created_at', { ascending: true });

    if (error || !results || results.length === 0)
        return alert("No results found for this semester yet.");

    // Get credit units and course titles from catalog
    const courseKeys = [...new Set(results.map(r => (r.subject || r.course || 'N/A').toUpperCase()))];
    let catalogMap = {};
    try {
        const { data: catalog } = await sb.from('course_catalog')
            .select('course_code, credit_units, course_title')
            .eq('department', localData.dept.toUpperCase().trim())
            .eq('level', localData.level)
            .in('course_code', courseKeys);
        if (catalog) catalog.forEach(c => {
            catalogMap[c.course_code.toUpperCase()] = {
                units: c.credit_units,
                title: c.course_title || '—'
            };
        });
    } catch (e) { /* fallback to 3 units */ }

    // Build courseMap for this semester only
    const courseMap = {};
    for (const r of results) {
        const key = (r.subject || r.course || 'N/A').toUpperCase();
        if (!courseMap[key]) courseMap[key] = { exam: null, ca: null };
        if (r.is_ca) courseMap[key].ca   = r;
        else         courseMap[key].exam = r;
    }

    const { html: semBlock, totalUnits, totalQP, gpa } = buildSemesterTableHTML(
        localData.semester, courseMap, catalogMap
    );
    const gpaColor = !gpa ? '#555' : parseFloat(gpa) >= 3.5 ? '#0f5132' : parseFloat(gpa) >= 2.0 ? '#b45309' : '#cc0000';

    const slipHTML = `<!DOCTYPE html>
<html><head><title>${localData.semester} Semester Result Slip — ${localData.name}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; padding: 28px; color: #111; font-size: 11.5px; }
  .header { text-align:center; border-bottom: 3px solid #0f5132; padding-bottom:14px; margin-bottom:18px; }
  .header h1 { color:#0f5132; font-size:1.2rem; margin-bottom:3px; }
  .header h2 { color:#333; font-size:0.95rem; font-weight:normal; }
  .header p  { color:#888; font-size:0.72rem; margin-top:4px; }
  .info-box  { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px 24px; border:1px solid #ccc; border-radius:8px; padding:12px 16px; margin-bottom:18px; background:#f9fdfb; }
  .info-item label { display:block; font-size:0.62rem; color:#888; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px; }
  .info-item span  { font-weight:bold; color:#0f5132; font-size:0.88rem; }
  .sem-block { margin-bottom:14px; }
  .sem-title { font-weight:bold; color:#0f5132; font-size:0.85rem; margin-bottom:6px; letter-spacing:0.4px; text-transform:uppercase; }
  table { width:100%; border-collapse:collapse; }
  thead tr { background:#0f5132; color:white; }
  th { padding:7px 9px; text-align:left; font-size:0.72rem; letter-spacing:0.3px; }
  td { border:1px solid #ddd; padding:6px 9px; font-size:0.78rem; }
  .remark-pill { display:inline-block; padding:2px 8px; border-radius:10px; font-size:0.68rem; font-weight:bold; }
  .sem-gpa-line { margin-top:6px; padding:7px 12px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; font-size:0.75rem; color:#14532d; }
  .key-box { margin-top:14px; padding:9px 13px; background:#f0fdf4; border:1px solid #86efac; border-radius:8px; font-size:0.7rem; color:#14532d; }
  .key-box strong { display:block; margin-bottom:3px; }
  .sig-section { margin-top:36px; display:grid; grid-template-columns:1fr 1fr 1fr; gap:20px; }
  .sig-box { border-top:1px solid #333; padding-top:8px; text-align:center; font-size:0.72rem; color:#555; }
  .sig-box strong { display:block; color:#111; margin-top:2px; }
  .footer { margin-top:20px; text-align:center; font-size:0.65rem; color:#aaa; border-top:1px solid #eee; padding-top:8px; }
  @media print { body { padding:16px; } }
</style>
</head>
<body>
  <div class="header">
    <div style="display:flex; flex-direction:column; align-items:center; text-align:center; margin-bottom:8px;">
      <img src="${INSTITUTION_LOGO}" alt="Institution Logo" style="width:55px; height:auto; margin-bottom:5px;">
      <div style="font-weight:bold; color:#0f5132; font-size:0.88rem; letter-spacing:0.3px;">${INSTITUTION_NAME}</div>
      <div style="font-size:0.66rem; color:#666;">${INSTITUTION_ADDRESS}</div>
    </div>
    <h1>SEMESTER RESULT SLIP</h1>
    <h2 style="color:#0f5132; font-size:1rem; font-weight:bold; margin-top:4px;">${localData.semester} Semester &nbsp;|&nbsp; ${localData.level}L &nbsp;|&nbsp; ${localData.dept}</h2>
    <p style="font-size:0.72rem; color:#888; margin-top:2px; font-style:italic;">Single Semester Record — Not a Full Transcript</p>
    <p>POWERED BY MU'UJIZA DATA &nbsp;|&nbsp; Generated: ${new Date().toLocaleDateString('en-NG', {day:'2-digit', month:'long', year:'numeric'})}</p>
  </div>
  <div class="info-box">
    <div class="info-item"><label>Full Name</label><span>${localData.name}</span></div>
    <div class="info-item"><label>Matrix Number</label><span>${localData.matrix}</span></div>
    <div class="info-item"><label>Department</label><span>${localData.dept}</span></div>
    <div class="info-item"><label>Faculty</label><span>${localData.faculty || 'N/A'}</span></div>
    <div class="info-item"><label>Level</label><span>${localData.level}L</span></div>
    <div class="info-item"><label>Semester</label><span>${localData.semester} Semester</span></div>
  </div>
  ${semBlock}
  <div class="key-box">
    <strong>Approved Grading Scale (NUC / NCCE):</strong>
    A (≥70) — Excellent &nbsp;|&nbsp; B (60–69) — Very Good &nbsp;|&nbsp; C (50–59) — Good &nbsp;|&nbsp; D (40–49) — Pass &nbsp;|&nbsp; F (&lt;40) — Fail
  </div>
  <div class="sig-section">
    <div class="sig-box">
        &nbsp;<br><strong>Student Signature</strong>Name: ${localData.name}
    </div>
    <div class="sig-box">
        &nbsp;<br><strong>Head of Department</strong>Signature &amp; Stamp
    </div>
    <div class="sig-box">
        &nbsp;<br><strong>Dean / Registrar</strong>Signature &amp; Stamp
    </div>
  </div>
  <div class="footer">CBT SYSTEM © ${new Date().getFullYear()} &nbsp;|&nbsp; POWERED BY MU'UJIZA DATA &nbsp;|&nbsp; This slip is auto-generated and subject to ratification.</div>
</body></html>`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert("⚠️ Pop-up blocked! Please allow pop-ups for this site in your browser, then try again.");
    printWindow.document.write(slipHTML);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
}

// ── EXAM CARD (ORIGINAL PDF) ───────────────────────────────────────
async function checkExamCardReleased() {
    if (!localData) return;
    try {
        const { data, error } = await sb.rpc('is_exam_card_released', {
            p_dept:     localData.dept.trim().toUpperCase(),
            p_level:    localData.level,
            p_semester: localData.semester
        });
        const navBtn = document.getElementById('downloadExamCardNav');
        if (!navBtn) return;
        const isReleased = data === true;
        navBtn.style.display = isReleased ? 'flex' : 'none';
    } catch (e) {
        console.error("Exam card check error:", e);
        const navBtn = document.getElementById('downloadExamCardNav');
        if (navBtn) navBtn.style.display = 'none';
    }
}

async function downloadExamCardPDF() {
    if (!localData) return alert("Student data not loaded.");
    const { data: regData, error } = await sb.from('course_registrations')
        .select('course_code')
        .eq('matrix_no', localData.matrix)
        .eq('department', localData.dept.toUpperCase().trim())
        .eq('level', localData.level)
        .eq('semester', localData.semester);
    if (error || !regData || regData.length === 0) return alert("You have no registered courses for this semester. Please complete course registration first.");
    const courses = regData.map(r => (r.course_code || '').toUpperCase().trim()).filter(Boolean).sort();
    let scheduleMap = {};
    try {
        const { data: sched } = await sb.rpc('get_exam_schedules_for_student', {
            p_dept:     localData.dept.toUpperCase().trim(),
            p_level:    localData.level,
            p_semester: localData.semester
        });
        if (sched) sched.forEach(s => { scheduleMap[(s.course_code || '').toUpperCase().trim()] = s; });
    } catch(e) {}
    const qrData    = JSON.stringify({ matrix: localData.matrix, name: localData.name, dept: localData.dept, level: localData.level, semester: localData.semester });
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrData)}&margin=0`;
    const rows = courses.map((c, i) => {
        const sched   = scheduleMap[c] || {};
        const dateStr = sched.exam_date ? new Date(sched.exam_date).toLocaleDateString('en-GB', { weekday:'short', day:'2-digit', month:'short', year:'numeric' }) : '____________';
        const timeStr = sched.exam_time ? sched.exam_time.substring(0,5) : '____________';
        const venue   = sched.venue ? sanitise(sched.venue) : '____________';
        return `
        <tr style="background:${i % 2 === 0 ? '#f9f9f9' : '#fff'}">
            <td style="text-align:center; width:36px;">${i + 1}</td>
            <td style="font-weight:bold; letter-spacing:0.5px;">${c}</td>
            <td style="text-align:center; color:${sched.exam_date ? '#0f5132' : '#aaa'};">${dateStr}</td>
            <td style="text-align:center; color:${sched.exam_time ? '#0f5132' : '#aaa'};">${timeStr}</td>
            <td style="color:${sched.venue ? '#333' : '#aaa'};">${venue}</td>
            <td style="text-align:center; color:#aaa; width:110px;">____________</td>
        </tr>`;
    }).join('');
    const printHTML = `<!DOCTYPE html>
<html><head><title>Exam Card — ${localData.name}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; padding: 30px; color: #111; font-size: 13px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #0f5132; padding-bottom:14px; margin-bottom:20px; }
  .header-text h1 { color:#0f5132; font-size:1.2rem; margin-bottom:4px; }
  .header-text p  { color:#555; font-size:0.75rem; }
  .qr-block { text-align:center; }
  .qr-block img { width:100px; height:100px; border:2px solid #0f5132; border-radius:6px; }
  .qr-block small { display:block; color:#aaa; font-size:0.6rem; margin-top:3px; }
  .info-box  { display:grid; grid-template-columns:1fr 1fr; gap:10px 30px; border:1px solid #ccc; border-radius:8px; padding:14px 18px; margin-bottom:22px; background:#f9fdfb; }
  .info-item label { display:block; font-size:0.68rem; color:#888; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px; }
  .info-item span  { font-weight:bold; color:#0f5132; font-size:0.92rem; }
  .notice { background:#fffbea; border:1px solid #f0c040; border-radius:6px; padding:10px 14px; font-size:0.78rem; color:#856404; margin-bottom:18px; }
  table { width:100%; border-collapse:collapse; margin-bottom:30px; }
  thead tr { background:#0f5132; color:white; }
  th { padding:9px 10px; text-align:left; font-size:0.75rem; letter-spacing:0.4px; }
  td { border:1px solid #ddd; padding:9px 10px; }
  .sign-section { display:grid; grid-template-columns:1fr 1fr; gap:30px; margin-top:30px; margin-bottom:20px; }
  .sign-box { border-top:1px solid #999; padding-top:8px; }
  .sign-box .sign-line { height:50px; border-bottom:1px dashed #ccc; margin-bottom:4px; }
  .sign-box p { font-size:0.72rem; color:#555; text-align:center; margin-top:4px; }
  .stamp-box { border:2px dashed #ccc; border-radius:8px; height:90px; display:flex; align-items:center; justify-content:center; color:#ccc; font-size:0.75rem; margin-top:20px; margin-bottom:20px; }
  .footer { margin-top:24px; text-align:center; font-size:0.65rem; color:#aaa; border-top:1px solid #eee; padding-top:10px; }
  @media print { body { padding:15px; } }
</style>
</head>
<body>
  <div class="header">
    <div class="header-text" style="text-align:center;">
      <div style="display:flex; flex-direction:column; align-items:center; margin-bottom:6px;">
        <img src="${INSTITUTION_LOGO}" alt="Institution Logo" style="width:44px; height:auto; margin-bottom:4px;">
        <div style="font-weight:bold; color:#0f5132; font-size:0.8rem; letter-spacing:0.3px;">${INSTITUTION_NAME}</div>
        <div style="font-size:0.62rem; color:#666;">${INSTITUTION_ADDRESS}</div>
      </div>
      <h1>STUDENT EXAM CARD</h1>
      <p>Official CBT Examination Hall Ticket &nbsp;|&nbsp; Generated: ${new Date().toLocaleDateString()}</p>
      <p style="margin-top:4px; color:#0f5132; font-size:0.7rem; font-weight:bold;">
        Academic Session: ${new Date().getFullYear()}/${new Date().getFullYear() + 1}
      </p>
    </div>
    <div class="qr-block">
      <img src="${qrCodeUrl}" alt="QR Code" onerror="this.style.display='none'">
      <small>Scan to verify</small>
    </div>
  </div>
  <div class="info-box">
    <div class="info-item"><label>Full Name</label><span>${localData.name}</span></div>
    <div class="info-item"><label>Matrix Number</label><span>${localData.matrix}</span></div>
    <div class="info-item"><label>Faculty</label><span>${localData.faculty || 'N/A'}</span></div>
    <div class="info-item"><label>Department</label><span>${localData.dept}</span></div>
    <div class="info-item"><label>Level</label><span>${localData.level}L</span></div>
    <div class="info-item"><label>Semester</label><span>${localData.semester} Semester</span></div>
  </div>
  <div class="notice">
    ⚠️ <strong>Instructions:</strong> Present this card at the examination hall entrance along with your valid student ID.
    The CBT access token for each course will be shown on your dashboard when the gate is open.
    You may only sit for courses listed below. This card is <strong>non-transferable</strong>.
  </div>
  
  <!-- ========== COURSES TABLE (comes FIRST) ========== -->
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Course Code</th>
        <th>Date</th>
        <th>Time</th>
        <th>Venue</th>
        <th>Invigilator Signature</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  
  <!-- ========== SIGNATURES (come AFTER the table) ========== -->
  <div class="sign-section">
    <div class="sign-box"><div class="sign-line"></div><p>Exam Officer Signature &amp; Date</p></div>
    <div class="sign-box"><div class="sign-line"></div><p>HOD / Dean Signature &amp; Date</p></div>
  </div>
  
  <div class="footer">
    CBT SYSTEM © ${new Date().getFullYear()} &nbsp;|&nbsp; POWERED BY MU'UJIZA DATA &nbsp;|&nbsp; This card is non-transferable.
  </div>
</body>
</html>`;
    const win = window.open('', '_blank');
    win.document.write(printHTML);
    win.document.close();
    win.onload = () => win.print();
}


// ── SCHEDULED EXAM CARD (ORIGINAL) ─────────────────────────────────
async function checkScheduledExamCardReleased() {
    if (!localData) return;
    try {
        const { data, error } = await sb.rpc('is_scheduled_exam_released', {
            p_dept:     localData.dept.trim().toUpperCase(),
            p_level:    localData.level,
            p_semester: localData.semester
        });
        const btn = document.getElementById('downloadScheduledExamCardNav');
        if (!btn) return;
        btn.style.display = (data === true) ? 'flex' : 'none';
    } catch (e) {
        console.error("Scheduled exam card check error:", e);
        const btn = document.getElementById('downloadScheduledExamCardNav');
        if (btn) btn.style.display = 'none';
    }
}

async function downloadScheduledExamCardPDF() {
    if (!localData) return alert("Student data not loaded.");
    const dept     = localData.dept.trim();
    const level    = localData.level;
    const semester = localData.semester;
    const { data: schedules, error } = await sb.rpc('get_exam_schedules_for_student', {
        p_dept:     dept.toUpperCase().trim(),
        p_level:    level,
        p_semester: semester
    });
    if (error) { console.error("Exam schedule fetch error:", error); alert("Error loading exam schedule: " + error.message); return; }
    if (!schedules || schedules.length === 0) { alert("No exam schedule found for your group. Contact the admin."); return; }
    const qrData    = JSON.stringify({ matrix: localData.matrix, name: localData.name, dept, level, semester });
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrData)}&margin=0`;
    const rows = schedules.map((s, i) => {
        const dateStr = s.exam_date ? new Date(s.exam_date).toLocaleDateString('en-GB', { weekday:'short', day:'2-digit', month:'short', year:'numeric' }) : '—';
        const timeStr = s.exam_time ? s.exam_time.substring(0,5) : '—';
        return `
        <tr style="background:${i%2===0?'#f9f9f9':'#fff'}">
            <td style="padding:9px 10px; text-align:center;">${i+1}</td>
            <td style="padding:9px 10px; font-weight:bold; letter-spacing:0.5px;">${sanitise(s.course_code)}</td>
            <td style="padding:9px 10px; color:#0f5132;">${dateStr}</td>
            <td style="padding:9px 10px; color:#0f5132;">${timeStr}</td>
            <td style="padding:9px 10px;">${s.venue ? sanitise(s.venue) : '—'}</td>
            <td style="padding:9px 10px; color:#aaa; text-align:center;">____________</td>
        </td>`;
    }).join('');
    const printHTML = `<!DOCTYPE html>
<html><head><title>Scheduled Exam Card — ${localData.name}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; padding: 30px; color: #111; font-size: 13px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #0f5132; padding-bottom:14px; margin-bottom:20px; }
  .header-text h1 { color:#0f5132; font-size:1.2rem; margin-bottom:4px; }
  .header-text p  { color:#555; font-size:0.75rem; }
  .qr-block { text-align:center; }
  .qr-block img { width:100px; height:100px; border:2px solid #0f5132; border-radius:6px; }
  .qr-block small { display:block; color:#aaa; font-size:0.6rem; margin-top:3px; }
  .info-box { display:grid; grid-template-columns:1fr 1fr; gap:10px 30px; border:1px solid #ccc; border-radius:8px; padding:14px 18px; margin-bottom:22px; background:#f9fdfb; }
  .info-item label { display:block; font-size:0.68rem; color:#888; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px; }
  .info-item span  { font-weight:bold; color:#0f5132; font-size:0.92rem; }
  .notice { background:#fffbea; border:1px solid #f0c040; border-radius:6px; padding:10px 14px; font-size:0.78rem; color:#856404; margin-bottom:18px; }
  table { width:100%; border-collapse:collapse; }
  thead tr { background:#0f5132; color:white; }
  th { padding:9px 10px; text-align:left; font-size:0.75rem; letter-spacing:0.4px; }
  td { border:1px solid #ddd; }
  .sign-section { display:grid; grid-template-columns:1fr 1fr; gap:30px; margin-top:30px; }
  .sign-box { border-top:1px solid #999; padding-top:8px; }
  .sign-box .sign-line { height:50px; border-bottom:1px dashed #ccc; margin-bottom:4px; }
  .sign-box p { font-size:0.72rem; color:#555; text-align:center; margin-top:4px; }
  .stamp-box { border:2px dashed #ccc; border-radius:8px; height:90px; display:flex; align-items:center; justify-content:center; color:#ccc; font-size:0.75rem; margin-top:20px; }
  .footer { margin-top:24px; text-align:center; font-size:0.65rem; color:#aaa; border-top:1px solid #eee; padding-top:10px; }
  @media print { body { padding:15px; } }
</style>
</head>
<body>
  <div class="header">
    <div class="header-text" style="text-align:center;">
      <div style="display:flex; flex-direction:column; align-items:center; margin-bottom:6px;">
        <img src="${INSTITUTION_LOGO}" alt="Institution Logo" style="width:44px; height:auto; margin-bottom:4px;">
        <div style="font-weight:bold; color:#0f5132; font-size:0.8rem; letter-spacing:0.3px;">${INSTITUTION_NAME}</div>
        <div style="font-size:0.62rem; color:#666;">${INSTITUTION_ADDRESS}</div>
      </div>
      <h1>SCHEDULED EXAM CARD</h1>
      <p>Official Physical Examination Hall Ticket &nbsp;|&nbsp; Generated: ${new Date().toLocaleDateString()}</p>
      <p style="margin-top:4px; color:#0f5132; font-size:0.7rem; font-weight:bold;">
        Academic Session: ${new Date().getFullYear()}/${new Date().getFullYear() + 1}
      </p>
    </div>
    <div class="qr-block">
      <img src="${qrCodeUrl}" alt="QR Code" onerror="this.style.display='none'">
      <small>Scan to verify</small>
    </div>
  </div>
  <div class="info-box">
    <div class="info-item"><label>Full Name</label><span>${localData.name}</span></div>
    <div class="info-item"><label>Matrix Number</label><span>${localData.matrix}</span></div>
    <div class="info-item"><label>Faculty</label><span>${localData.faculty || 'N/A'}</span></div>
    <div class="info-item"><label>Department</label><span>${localData.dept}</span></div>
    <div class="info-item"><label>Level</label><span>${localData.level}L</span></div>
    <div class="info-item"><label>Semester</label><span>${localData.semester} Semester</span></div>
  </div>
  <div class="notice">
    ⚠️ <strong>Instructions:</strong> Present this card at the examination hall entrance with your valid student ID.
    This card is <strong>non-transferable</strong>. Ensure you arrive at least 15 minutes before your exam time.
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:36px;">#</th>
        <th>Course Code</th>
        <th>Date</th>
        <th>Time</th>
        <th>Venue</th>
        <th style="width:110px;">Invigilator Signature</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="sign-section">
    <div class="sign-box"><div class="sign-line"></div><p>Exam Officer Signature &amp; Date</p></div>
    <div class="sign-box"><div class="sign-line"></div><p>HOD / Dean Signature &amp; Date</p></div>
  </div>
  <div class="footer">
    CBT SYSTEM © ${new Date().getFullYear()} &nbsp;|&nbsp; POWERED BY MU'UJIZA DATA &nbsp;|&nbsp;
    This card is non-transferable and must be presented at every examination sitting.
  </div>
</body></html>`;
    const win = window.open('', '_blank');
    win.document.write(printHTML);
    win.document.close();
    win.onload = () => win.print();
}

// ── ASSIGNMENTS (ORIGINAL) ──────────────────────────────────────────
async function submitAssignment() {
    const student = JSON.parse(sessionStorage.getItem('student_data'));
    const course   = document.getElementById('assignCourse').value.trim().toUpperCase();
    const title    = document.getElementById('assignTitle').value.trim();
    const content  = document.getElementById('assignContent').value.trim();
    const msg      = document.getElementById('assignMsg');
    const btn      = document.getElementById('submitAssignmentBtn');

    if (!course || !title || !content) {
        msg.style.color = '#ff4444';
        msg.innerText = '⚠️ Please fill in all fields.';
        return;
    }

    btn.disabled = true;
    btn.innerText = 'Submitting...';

    try {
        const { error } = await sb.from('assignments').insert({
            student_name: student.name,
            matrix_no:    student.matrix,
            faculty:      student.faculty,
            department:   student.dept,
            level:        student.level,
            semester:     student.semester,
            course_code:  course,
            title:        title,
            content:      content,
            status:       'pending'
        });
        if (error) throw error;
        msg.style.color = '#00aa55';
        msg.innerText = '✅ Assignment submitted successfully!';
        document.getElementById('assignCourse').value  = '';
        document.getElementById('assignTitle').value   = '';
        document.getElementById('assignContent').value = '';
        loadMyAssignments();
    } catch (err) {
        msg.style.color = '#ff4444';
        msg.innerText = '❌ Submission failed: ' + err.message;
    } finally {
        btn.disabled = false;
        btn.innerText = '📤 SUBMIT ASSIGNMENT';
    }
}

async function loadMyAssignments() {
    const student = JSON.parse(sessionStorage.getItem('student_data'));
    const listDiv = document.getElementById('myAssignmentsList');
    const { data, error } = await sb.from('assignments')
        .select('*')
        .eq('matrix_no', student.matrix)
        .order('submitted_at', { ascending: false });
    if (error || !data || data.length === 0) {
        listDiv.innerHTML = '<p style="color:#a0aec0; text-align:center;">No assignments submitted yet.</p>';
        return;
    }
    listDiv.innerHTML = data.map(a => {
        const isGraded = a.status === 'graded';
        const scoreText = isGraded
            ? `<span style="color:#0f5132; font-weight:bold; font-size:1.1rem;">${a.score} / ${a.max_score}</span>`
            : `<span style="color:#f59e0b; font-weight:bold;">Pending</span>`;
        const feedbackText = a.feedback
            ? `<p style="color:#555; font-size:0.85rem; margin-top:6px; border-left:3px solid #00ff88; padding-left:8px;">💬 ${sanitise(a.feedback)}</p>`
            : '';
        const deleteBtn = isGraded
            ? `<button data-id="${a.id}" class="delete-assign-btn" style="background:#ff4444; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer; font-size:0.75rem; margin-left:8px;">🗑️</button>`
            : '';
        return `
            <div style="padding:14px; margin-bottom:10px; border-radius:8px;
                        border-left:5px solid ${isGraded ? '#00ff88' : '#f59e0b'};
                        background:#f8fdf9;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong style="color:#0f5132;">${sanitise(a.course_code)}</strong>
                        <span style="color:#666; font-size:0.85rem; margin-left:8px;">${sanitise(a.title)}</span>
                    </div>
                    <div style="display:flex; align-items:center;">
                        ${scoreText}
                        ${deleteBtn}
                    </div>
                </div>
                ${feedbackText}
                <small style="color:#a0aec0;">Submitted: ${new Date(a.submitted_at).toLocaleDateString()}</small>
            </div>
        `;
    }).join('');
}

async function deleteStudentAssignment(id) {
    if (!confirm('Delete this graded assignment? This cannot be undone.')) return;
    const { error } = await sb.from('assignments').delete().eq('id', id);
    if (error) alert('Delete failed: ' + error.message);
    else loadMyAssignments();
}

// ── COURSE REGISTRATION ────────────────────────────────────────────────────

const REG_MIN_UNITS = 15;
const REG_MAX_UNITS = 24;

async function loadCourseRegistration() {
    const listDiv     = document.getElementById('regCourseList');
    const unitBar     = document.getElementById('regUnitBar');
    const actionArea  = document.getElementById('regActionArea');
    const closedNote  = document.getElementById('regClosedNotice');
    const msgEl       = document.getElementById('regMsg');

    if (!listDiv || !localData) return;
    listDiv.innerHTML = '<p style="color:#a0aec0;">Loading courses...</p>';
    if (msgEl) msgEl.textContent = '';

    // Reset shared carryover units tracker
    window._regCarryoverUnits = 0;
    window._regCarryoverCodes = [];

    try {
        // 1. Check if admin has opened registration for this group
        const { data: control } = await sb
            .from('registration_control')
            .select('is_open')
            .eq('department', localData.dept.toUpperCase().trim())
            .eq('level', localData.level)
            .eq('semester', localData.semester)
            .maybeSingle();

        const isOpen = control ? control.is_open : false;

        if (!isOpen) {
            closedNote.style.display  = 'block';
            unitBar.style.display     = 'none';
            actionArea.style.display  = 'none';
            listDiv.innerHTML = '';
        } else {
            closedNote.style.display = 'none';
        }

        // 2. Fetch student's active carryover sessions so they show first
        //    Carryovers are mandatory to register first per institution policy.
        //    BUT only show them once results are officially released — otherwise
        //    a student who just submitted sees their score and carryover status
        //    before admin has formally released results.
        let slipReleased = false;
        try {
            const { data: _sr } = await sb.rpc('is_results_released', {
                p_dept:     localData.dept.trim().toUpperCase(),
                p_level:    localData.level,
                p_semester: localData.semester
            });
            slipReleased = _sr === true;
        } catch (_) { slipReleased = false; }

        const coCodesRaw = [];
        let coCatalogMap = {};

        if (slipReleased === true) {
            const { data: coSessions } = await sb
            .from('exam_sessions')
            .select('carryover_course, original_level, original_semester')
            .eq('is_carryover', true)
            .eq('is_active', 'true')
            .eq('department', localData.dept.toUpperCase().trim())
            .eq('original_level', localData.level)
            .eq('original_semester', localData.semester);

        // Also check which carryover courses student hasn't passed yet
        const { data: coResultsData } = await sb
            .from('results')
            .select('subject, score')
            .eq('matrix_no', localData.matrix);

        const passedSet = new Set();
        (coResultsData || []).forEach(r => {
            if (parseFloat(r.score) >= 50)
                passedSet.add((r.subject || '').toUpperCase().trim());
        });

        // Filter to only unpassed carryover courses, deduplicate, push into outer array
        const rawFiltered = [...new Set(
            (coSessions || [])
                .map(s => (s.carryover_course || '').toUpperCase().trim())
                .filter(c => c && !passedSet.has(c))
        )];
        coCodesRaw.push(...rawFiltered);

        // Get credit units for carryover courses from catalog
        if (coCodesRaw.length > 0) {
            const { data: coCat } = await sb
                .from('course_catalog')
                .select('course_code, credit_units')
                .in('course_code', coCodesRaw)
                .eq('department', localData.dept.toUpperCase().trim());
            (coCat || []).forEach(c => {
                coCatalogMap[(c.course_code || '').toUpperCase().trim()] = parseInt(c.credit_units) || 3;
            });
        }
        } // end if (slipReleased)

        // Build carryover display — locked, pre-checked, counts toward total
        let carryoverHTML = '';
        if (coCodesRaw.length > 0) {
            let coUnits = 0;
            coCodesRaw.forEach(code => {
                const units = coCatalogMap[code] || 3;
                coUnits += units;
                window._regCarryoverCodes.push({ course_code: code, units });
            });
            window._regCarryoverUnits = coUnits;

            carryoverHTML = `
            <div style="background:#fff3cd; border-left:5px solid #ff9800;
                        border-radius:10px; padding:14px 18px; margin-bottom:16px;">
                <p style="margin:0 0 10px 0; color:#856404; font-weight:bold; font-size:0.9rem;">
                    ⚠️ You have carryover course(s) — these are automatically included and counted
                    toward your unit total first, as required by institution policy.
                </p>
                ${coCodesRaw.map(code => {
                    const units = coCatalogMap[code] || 3;
                    return `
                    <div style="display:flex; justify-content:space-between; align-items:center;
                                padding:12px 14px; margin-bottom:8px; background:white; border-radius:8px;
                                border-left:5px solid #ff9800; opacity:0.9;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <input type="checkbox" checked disabled
                                   style="width:18px; height:18px; accent-color:#ff9800;">
                            <div>
                                <strong style="color:#c05000;">${sanitise(code)}</strong>
                                <small style="color:#856404; margin-left:8px;">Carryover — locked</small>
                            </div>
                        </div>
                        <span style="background:#ff9800; color:white; font-weight:bold; font-size:0.85rem;
                                     padding:4px 12px; border-radius:20px; white-space:nowrap;">
                            ${units} unit${units !== 1 ? 's' : ''}
                        </span>
                    </div>`;
                }).join('')}
                <p style="margin:8px 0 0 0; color:#856404; font-size:0.85rem;">
                    Carryover subtotal: <strong>${coUnits} unit${coUnits !== 1 ? 's' : ''}</strong>
                    — remaining space: <strong>${REG_MAX_UNITS - coUnits} units</strong>
                </p>
            </div>`;
        }

        // 3. Load catalog courses for current semester
        let catalogQuery = sb
            .from('course_catalog')
            .select('course_code, course_title, credit_units')
            .eq('department', localData.dept.toUpperCase().trim())
            .eq('level', localData.level)
            .eq('semester', localData.semester)
            .order('course_code');

        if (localData.faculty && localData.faculty !== 'Not Specified') {
            catalogQuery = catalogQuery.eq('faculty', localData.faculty);
        }

        const { data: catalog, error: catErr } = await catalogQuery;
        if (catErr) throw catErr;

        if (!catalog || catalog.length === 0) {
            listDiv.innerHTML = carryoverHTML +
                '<p style="color:#a0aec0;">No courses found in catalog for your department/level/semester. Contact admin.</p>';
            unitBar.style.display    = 'none';
            actionArea.style.display = 'none';
            return;
        }

        // 4. Load already-registered courses for pre-checking
        const { data: existing } = await sb
            .from('course_registrations')
            .select('course_code')
            .eq('matrix_no', localData.matrix)
            .eq('department', localData.dept.toUpperCase().trim())
            .eq('level', localData.level)
            .eq('semester', localData.semester);

        const alreadyReg = new Set((existing || []).map(r => r.course_code.toUpperCase().trim()));

        // 5. Render carryover block first, then current semester checkboxes
        const catalogHTML = catalog.map(c => {
            const code    = (c.course_code || '').toUpperCase().trim();
            const title   = c.course_title || '';
            const units   = parseInt(c.credit_units) || 3;
            const checked = alreadyReg.has(code) ? 'checked' : '';
            const disabled = !isOpen ? 'disabled' : '';
            return `
            <div class="reg-course-card" id="regCard_${code}"
                 style="display:flex; justify-content:space-between; align-items:center;
                        padding:14px 18px; margin-bottom:10px; background:white; border-radius:10px;
                        border-left:5px solid ${alreadyReg.has(code) ? '#00ff88' : '#ddd'};
                        box-shadow:0 2px 6px rgba(0,0,0,0.04); transition:all 0.2s;">
                <label style="display:flex; align-items:center; gap:14px;
                              cursor:${isOpen ? 'pointer' : 'default'}; flex:1;">
                    <input type="checkbox" class="reg-checkbox"
                           data-code="${code}" data-units="${units}"
                           ${checked} ${disabled}
                           style="width:18px; height:18px; accent-color:#00ff88;
                                  cursor:${isOpen ? 'pointer' : 'default'};">
                    <div>
                        <strong style="color:#0f5132; font-size:1rem;">${sanitise(code)}</strong>
                        ${title ? `<span style="color:#555; margin-left:8px; font-size:0.9rem;">${sanitise(title)}</span>` : ''}
                    </div>
                </label>
                <span style="background:#0a3d25; color:#facc15; font-weight:bold; font-size:0.85rem;
                             padding:4px 12px; border-radius:20px; white-space:nowrap; margin-left:10px;">
                    ${units} unit${units !== 1 ? 's' : ''}
                </span>
            </div>`;
        }).join('');

        listDiv.innerHTML = carryoverHTML +
            (coCodesRaw.length > 0
                ? `<p style="color:#555; font-weight:bold; margin-bottom:12px;">
                       📚 Current Semester Courses — select to add:
                   </p>`
                : '') +
            catalogHTML;

        // 6. Show unit bar and action area only if registration is open
        if (isOpen) {
            unitBar.style.display    = 'flex';
            actionArea.style.display = 'block';
            updateRegUnitCounter();

            document.querySelectorAll('.reg-checkbox').forEach(cb => {
                cb.addEventListener('change', () => {
                    const code = cb.getAttribute('data-code');
                    const card = document.getElementById(`regCard_${code}`);
                    if (card) {
                        card.style.borderLeftColor = cb.checked ? '#00ff88' : '#ddd';
                        card.style.boxShadow = cb.checked
                            ? '0 4px 12px rgba(0,255,136,0.15)'
                            : '0 2px 6px rgba(0,0,0,0.04)';
                    }
                    updateRegUnitCounter();
                });
            });

            document.getElementById('regSaveBtn').onclick = saveCourseRegistration;
        } else {
            unitBar.style.display    = 'none';
            actionArea.style.display = 'none';
        }

    } catch (err) {
        console.error('loadCourseRegistration error:', err);
        listDiv.innerHTML = `<p style="color:red;">Error loading courses: ${sanitise(err.message)}</p>`;
    }
}

function updateRegUnitCounter() {
    const checkboxes = document.querySelectorAll('.reg-checkbox:checked');
    const coBase = window._regCarryoverUnits || 0;
    let selected = 0;
    checkboxes.forEach(cb => { selected += parseInt(cb.getAttribute('data-units')) || 0; });
    const total = coBase + selected;

    const totalEl  = document.getElementById('regTotalUnits');
    const statusEl = document.getElementById('regUnitStatus');
    if (!totalEl || !statusEl) return;

    totalEl.textContent = total;

    // Show breakdown if there are carryover units
    if (coBase > 0) {
        totalEl.title = `Carryover: ${coBase} + Selected: ${selected}`;
    }

    if (total === 0) {
        statusEl.textContent = 'No courses selected';
        statusEl.style.background = '#555';
    } else if (total < REG_MIN_UNITS) {
        statusEl.textContent = `Below minimum (${REG_MIN_UNITS} units)`;
        statusEl.style.background = '#ff4444';
    } else if (total > REG_MAX_UNITS) {
        statusEl.textContent = `Exceeds maximum (${REG_MAX_UNITS} units)!`;
        statusEl.style.background = '#ff4444';
    } else {
        statusEl.textContent = `✅ Valid (${REG_MIN_UNITS}–${REG_MAX_UNITS} units)`;
        statusEl.style.background = '#00a854';
    }
}

async function saveCourseRegistration() {
    const btn   = document.getElementById('regSaveBtn');
    const msgEl = document.getElementById('regMsg');

    // Carryover units + codes (set by loadCourseRegistration)
    const coBase  = window._regCarryoverUnits || 0;
    const coCodes = window._regCarryoverCodes || [];

    const checkboxes = document.querySelectorAll('.reg-checkbox');
    const selected = [];
    let selectedUnits = 0;

    checkboxes.forEach(cb => {
        if (cb.checked) {
            selected.push({
                course_code: cb.getAttribute('data-code'),
                units: parseInt(cb.getAttribute('data-units')) || 0
            });
            selectedUnits += parseInt(cb.getAttribute('data-units')) || 0;
        }
    });

    const totalUnits = coBase + selectedUnits;

    // Hard block: exceeds max (carryover + selected combined)
    if (totalUnits > REG_MAX_UNITS) {
        msgEl.style.color = '#ff4444';
        msgEl.textContent = `❌ Total units (${totalUnits}) exceed the maximum of ${REG_MAX_UNITS}.`
            + (coBase > 0 ? ` Note: ${coBase} unit(s) are already taken by your carryover course(s).` : '')
            + ` Please deselect some courses.`;
        return;
    }

    // Soft warn: below minimum
    if (totalUnits < REG_MIN_UNITS && (selected.length > 0 || coCodes.length > 0)) {
        const proceed = confirm(
            `⚠️ Total registered units (${totalUnits}) is below the minimum of ${REG_MIN_UNITS} units.\n\n`
            + (coBase > 0 ? `Carryover: ${coBase} units + Selected: ${selectedUnits} units = ${totalUnits} units.\n\n` : '')
            + `Do you want to save anyway?`
        );
        if (!proceed) return;
    }

    if (selected.length === 0 && coCodes.length === 0) {
        msgEl.style.color = '#ff4444';
        msgEl.textContent = '⚠️ Please select at least one course before saving.';
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Saving...';
    msgEl.textContent = '';

    try {
        // Delete existing registrations for this student/semester first
        const { error: delError } = await sb
            .from('course_registrations')
            .delete()
            .eq('matrix_no', localData.matrix)
            .eq('department', localData.dept.toUpperCase().trim())
            .eq('level', localData.level)
            .eq('semester', localData.semester);

        if (delError) throw new Error('Could not clear previous registration: ' + delError.message);

        // Build rows: carryover courses first, then selected semester courses
        const coRows = coCodes.map(c => ({
            matrix_no:   localData.matrix,
            course_code: c.course_code,
            faculty:     localData.faculty || null,
            department:  localData.dept.toUpperCase().trim(),
            level:       localData.level,
            semester:    localData.semester
        }));

        const semRows = selected.map(s => ({
            matrix_no:   localData.matrix,
            course_code: s.course_code,
            faculty:     localData.faculty || null,
            department:  localData.dept.toUpperCase().trim(),
            level:       localData.level,
            semester:    localData.semester
        }));

        const allRows = [...coRows, ...semRows];

        // Use upsert with onConflict to safely handle any residual duplicates
        const { error } = await sb
            .from('course_registrations')
            .upsert(allRows, {
                onConflict: 'matrix_no,course_code,department,level,semester',
                ignoreDuplicates: false
            });
        if (error) throw error;

        const totalCount = coRows.length + semRows.length;
        msgEl.style.color = '#00a854';
        msgEl.textContent = `✅ Registration saved! ${totalCount} course(s) | ${totalUnits} units`
            + (coBase > 0 ? ` (${coBase} carryover + ${selectedUnits} new)` : '')
            + `. Your Available Exams will now reflect your registered courses.`;

        // Refresh exam lists silently
        fetchExams();
        fetchCaExams();

    } catch (err) {
        msgEl.style.color = '#ff4444';
        msgEl.textContent = '❌ Save failed: ' + err.message;
    } finally {
        btn.disabled = false;
        btn.textContent = '💾 SAVE COURSE REGISTRATION';
    }
}