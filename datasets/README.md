# Datasets Folder

Yeh folder aap ke training/validation images aur annotations rakhne ke liye hai
(agar future mein retraining ya testing ke liye chahiye ho).

Suggested structure (agar use karna ho):

```
datasets/
  images/
    train/
    val/
  labels/
    train/
    val/
  data.yaml
```

Prediction/inference ke liye is folder ki zarurat nahi — sirf `model/best.pt` chahiye.
